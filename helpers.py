import pandas as pd
import streamlit as st

# ----------- Data
@st.cache_data
def gs_load() -> pd.DataFrame:
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

def df_detailed() -> pd.DataFrame:
    """Transform the loaded Google Sheets DataFrame by parsing dates and sorting."""

    # Get base dataframe
    df = gs_load()

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

    # # Apply formatting to existing dataframe
    # df = df.assign(
    #     Monto=lambda x: x['Monto'].apply(lambda m: f"{m:,.0f}"),
    #     Fecha=lambda x: x['Fecha'].apply(
    #         lambda d: d.strftime("%m/%d/%y %I:%M %p") if pd.notnull(d) else ""
    #     )
    # )

    # Sort values Z-A by Fecha
    df = df.sort_values(by="Fecha", ascending=False).reset_index(drop=True)

    return df

def df_grouped() -> pd.DataFrame:
    """Group the transformed DataFrame by Periodo, Categoria, Persona, and Semana,
    based on the existing dataframesumming the Monto for each group.
    """
    # Get the detailed dataframe first
    detailed_df = df_detailed()
    
    # Store original data types
    original_fecha_dtype = detailed_df['Fecha'].dtype
    
    # # Ensure Monto is numeric for grouping
    # detailed_df['Monto'] = pd.to_numeric(detailed_df['Monto'].str.replace(',', ''), errors='coerce')
    
    # Group by column series and aggregate by monto
    df = detailed_df.groupby(
        ['Fecha', 'Comercio', 'Periodo', 'Categoria', 'Persona', 'Semana'], 
        as_index=False
    )['Monto'].sum()

    # # Convert back to proper types for formatting
    # df = df.assign(
    #     Monto=lambda x: x['Monto'].apply(lambda m: f"{m:,.0f}"),
    #     Fecha=lambda x: x['Fecha'].apply(
    #         lambda d: pd.to_datetime(d).strftime("%m/%d/%y %I:%M %p") if pd.notnull(d) else ""
    #     )
    # )

    # Sort values Z-A by Fecha
    df = df.sort_values(by="Fecha", ascending=False).reset_index(drop=True)
    return df

# ----------- Constants
def get_unique(column: str, df: pd.DataFrame) -> list:
    """
    Get unique values from a specified column in the dataframe,
    prepended with 'All' option.
    """
    return ['All'] + sorted(df[column].unique().tolist())

#
# ----------- UI Streamlit
def st_selectbox(column: str, df: pd.DataFrame) -> str:
    """
    Return a Streamlit selectbox for the specified column
    using unique values from the dataframe.
    """
    return st.selectbox(
        label = column,
        options = get_unique(column, df),
        index = 0
    )