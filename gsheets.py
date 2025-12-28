import pandas as pd
import streamlit as st
# from typing import Optional

@st.cache_data
def load() -> pd.DataFrame:
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

def transform() -> pd.DataFrame:
    """Transform the loaded Google Sheets DataFrame by parsing dates and sorting."""

    # Get base dataframe
    df = load()

    # Set Persona based on Categoria and Comercio
    mask_super = df['Categoria'] == 'Super'
    mask_recibos = df['Categoria'] == 'Recibos'

    # For Super: always Casa
    df.loc[mask_super, 'Persona'] = 'Casa'

    # For Recibos: Kolbi → Andres, others → Casa
    df.loc[mask_recibos & (df['Comercio'] == 'Kolbi'), 'Persona'] = 'Andres'
    df.loc[mask_recibos & (df['Comercio'] != 'Kolbi'), 'Persona'] = 'Casa'

    # Add Periodo column
    df['Periodo'] = df['Fecha'].dt.to_period('M').astype(str)

    # Add Semana column
    df['Semana'] = df['Fecha'].dt.day.apply(lambda x: f"W{((x - 1) // 7) + 1}")
    
    return df

def group () -> pd.DataFrame:
    """Group the transformed DataFrame by Periodo, Categoria, Persona, and Semana,
    summing the Monto for each group.
    """

    df = transform()

    # Group by Periodo, Categoria, Persona, Semana and sum Monto
    grouped_df = df.groupby(
        ['Fecha', 'Comercio', 'Periodo', 'Categoria', 'Persona', 'Semana'], as_index=False
    )['Monto'].sum()

    return grouped_df

def style(df: pd.DataFrame, columns_to_keep: list[str]) -> pd.DataFrame:
    """
    Dynamically style a DataFrame by selecting specific columns and applying formatting.

    Args:
        df (pd.DataFrame): The input DataFrame.
        columns_to_keep (list[str]): List of columns to retain in the DataFrame.

    Returns:
        pd.DataFrame: A styled DataFrame with the specified columns and formatting applied.
    """
    # Keep desired columns for layout
    df = df[[col for col in columns_to_keep if col in df.columns]]

    # Return desired format columns
    return df.style.format({
        'Monto': '{:,.0f}',
        'Fecha': lambda t: t.strftime("%m/%d/%y %I:%M %p") if pd.notnull(t) else "",
    })