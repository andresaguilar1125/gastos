import pandas as pd
import streamlit as st
from typing import Optional

@st.cache_data
def load_gsheet() -> pd.DataFrame:
    """Load data from a Google Sheets CSV URL stored in Streamlit secrets under the
    top-level key `gs`.

    It will use all available URLs under `st.secrets['gs']` and merge them.

    Returns:
        pd.DataFrame: DataFrame loaded from the CSV URL(s).

    Raises:
        RuntimeError: if the `gs` section is missing in secrets.
    """
    base_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFpRO4TrwAcGggAjB_iZVtdKaKhv59Mhzqy7RhE6JYtYmG704aYHMc6Us1etPgoffJZuLtkk4Ec1fE/pub?gid="
    gs = st.secrets.get("gs")
    if not gs:
        raise RuntimeError("No 'gs' section found in Streamlit secrets (expecting 'gs' table).")

    dfs = []
    for key, sheet_id in gs.items():
        try:

            # get and parse data
            sheet_url = f"{base_url}{sheet_id}&single=true&output=csv"
            df = pd.read_csv(
                sheet_url,
                thousands=",",
                parse_dates=["Fecha"],
                date_parser=lambda x: pd.to_datetime(
                    x, format="%m/%d/%y %I:%M %p", errors="coerce"
                )
            )
            
            # Sort by date descending
            df = df.sort_values(
                by="Fecha", ascending=False
            ).reset_index(drop=True)

            # Add a column for each google sheet name
            df = df.assign(Categoria=key.capitalize())

            dfs.append(df)
        except Exception as e:
            st.warning(f"Failed to load sheet '{key}': {e}")
    if not dfs:
        raise RuntimeError("No sheets found to load.")
    return pd.concat(dfs, ignore_index=True)

def transform_gsheet(df: pd.DataFrame) -> pd.DataFrame:
    """Transform the loaded Google Sheets DataFrame by parsing dates and sorting.

    Args:
        df (pd.DataFrame): DataFrame loaded from Google Sheets.

    Returns:
        pd.DataFrame: Transformed DataFrame with parsed dates and sorted entries.
    """
    # Recibos
    mask = (df['Categoria'] == 'Recibos') & (df['Comercio'] == 'Kolbi')
    # print([mask]) #REVIEW only printing false where some values should be true
    df.loc[mask, 'Persona'] = 'Andres'
    
    # Super
    df['Persona'] = 'Casa'
    
    return df
