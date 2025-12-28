import streamlit as st
import pandas as pd
from datetime import date
from gsheets import transform, group, style

st.set_page_config(page_title="GSheet Data Viewer", layout="wide")

df = transform()
df_grouped = group()

# in app.py (sidebar)
options_periodo = ['All'] + sorted(df["Periodo"].unique().tolist())
_periodo = st.selectbox("Periodo", options_periodo, index=0)

options_categoria = ['All'] + sorted(df["Categoria"].unique().tolist())
_categoria = st.selectbox("Categoria", options_categoria, index=0)

options_persona = ['All'] + sorted(df["Persona"].unique().tolist())
_persona = st.selectbox("Persona", options_persona, index=0)

# filtering (replace previous df[...] expression)
filter = pd.Series(True, index=df.index)
if _periodo != 'All':
    filter &= df['Periodo'] == _periodo
if _categoria != 'All':
    filter &= df['Categoria'] == _categoria
if _persona != 'All':
    filter &= df['Persona'] == _persona

# slider for detailed or grouped view
view_option = st.selectbox("View Type", ["Detailed", "Grouped"])
if view_option == "Detailed":
    df = df[filter]
else:
    df = df_grouped[filter]

# Add dropdown menu for column selection
columns_available = ['All'] + df.columns.unique().tolist()
columns_to_keep = st.multiselect("Select Columns to Display", columns_available, default=columns_available[1:])

# If 'All' is selected, keep all columns
if 'All' in columns_to_keep:
    columns_to_keep = df.columns.tolist()

# Apply the style function with selected columns
df = style(df, columns_to_keep)

df