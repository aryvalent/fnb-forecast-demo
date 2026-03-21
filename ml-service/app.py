from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="FnB Forecasting ML Service (Optional)")


class HistoryRow(BaseModel):
    date: date
    outlet: str
    dish: str
    quantity: float = Field(ge=0)


class PredictRequest(BaseModel):
    history: List[HistoryRow]
    start_date: Optional[date] = None
    horizon_days: int = Field(default=7, ge=1, le=62)
    ridge_alpha: float = Field(default=2.0, ge=0)


class PredictionRow(BaseModel):
    date: date
    outlet: str
    dish: str
    predicted_quantity: float = Field(ge=0)


class PredictResponse(BaseModel):
    mode: str
    rows: List[PredictionRow]


def _iso(d: date) -> str:
    return d.isoformat()


def _group_history(history: List[HistoryRow]) -> Dict[Tuple[str, str], Dict[str, float]]:
    out: Dict[Tuple[str, str], Dict[str, float]] = {}
    for r in history:
        key = (r.outlet, r.dish)
        m = out.get(key)
        if m is None:
            m = {}
            out[key] = m
        m[_iso(r.date)] = float(r.quantity)
    return out


def _ridge_fit(X: np.ndarray, y: np.ndarray, alpha: float) -> np.ndarray:
    n_features = X.shape[1]
    A = X.T @ X + np.eye(n_features, dtype=np.float64) * float(alpha)
    b = X.T @ y
    return np.linalg.solve(A, b)


def _build_train_rows(series: Dict[str, float]) -> List[Tuple[date, float]]:
    ds = sorted((datetime.fromisoformat(k).date(), float(v)) for k, v in series.items())
    return ds


def _design_matrix(ds: List[Tuple[date, float]], horizon_days: int) -> Tuple[np.ndarray, np.ndarray, List[date]]:
    if not ds:
        return np.zeros((0, 9), dtype=np.float64), np.zeros((0,), dtype=np.float64), []

    by_date = {d: v for d, v in ds}
    dates = [d for d, _ in ds]
    min_d = dates[0]
    max_d = dates[-1]

    rows_X = []
    rows_y = []
    rows_dates = []

    d = min_d + timedelta(days=14)
    while d <= max_d:
        y = by_date.get(d)
        if y is None:
            d += timedelta(days=1)
            continue

        lag7 = by_date.get(d - timedelta(days=7), 0.0)
        lag1 = by_date.get(d - timedelta(days=1), 0.0)
        roll7_vals = [by_date.get(d - timedelta(days=i), 0.0) for i in range(1, 8)]
        roll7 = float(np.mean(roll7_vals)) if roll7_vals else 0.0
        dow = d.weekday()
        dow_oh = [1.0 if dow == k else 0.0 for k in range(7)]
        X = dow_oh + [lag1, lag7, roll7]

        rows_X.append(X)
        rows_y.append(y)
        rows_dates.append(d)
        d += timedelta(days=1)

    return np.asarray(rows_X, dtype=np.float64), np.asarray(rows_y, dtype=np.float64), rows_dates


def _predict_series(series: Dict[str, float], start: date, horizon_days: int, alpha: float) -> List[Tuple[date, float]]:
    ds = _build_train_rows(series)
    X, y, _ = _design_matrix(ds, horizon_days)
    if len(y) < 10:
        preds = []
        for i in range(horizon_days):
            d = start + timedelta(days=i)
            dow = d.weekday()
            vals = []
            for k in range(1, 29):
                ld = d - timedelta(days=k)
                if ld.weekday() == dow:
                    v = series.get(_iso(ld))
                    if v is not None:
                        vals.append(float(v))
            preds.append((d, float(np.mean(vals)) if vals else 0.0))
        return preds

    w = _ridge_fit(X, y, alpha=alpha)

    cache = dict(series)
    preds = []
    for i in range(horizon_days):
        d = start + timedelta(days=i)
        lag7 = float(cache.get(_iso(d - timedelta(days=7)), 0.0))
        lag1 = float(cache.get(_iso(d - timedelta(days=1)), 0.0))
        roll7_vals = [float(cache.get(_iso(d - timedelta(days=j)), 0.0)) for j in range(1, 8)]
        roll7 = float(np.mean(roll7_vals)) if roll7_vals else 0.0
        dow = d.weekday()
        dow_oh = [1.0 if dow == k else 0.0 for k in range(7)]
        Xp = np.asarray(dow_oh + [lag1, lag7, roll7], dtype=np.float64)
        yhat = float(max(0.0, Xp @ w))
        cache[_iso(d)] = yhat
        preds.append((d, yhat))

    return preds


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    start = req.start_date or (date.today() + timedelta(days=1))
    grouped = _group_history(req.history)

    out_rows: List[PredictionRow] = []
    for (outlet, dish), series in grouped.items():
        preds = _predict_series(series, start=start, horizon_days=req.horizon_days, alpha=req.ridge_alpha)
        for d, yhat in preds:
            out_rows.append(
                PredictionRow(date=d, outlet=outlet, dish=dish, predicted_quantity=float(round(yhat, 2)))
            )

    return PredictResponse(mode="ridge_dow_lags", rows=out_rows)

