import streamlit as st
import pandas as pd
from datetime import date
from data.gsheets import transform_gsheet
from style import style_dataframe

st.set_page_config(page_title="GSheet Data Viewer", layout="wide")

df = transform_gsheet()

# in app.py (sidebar)
options_periodo = ['All'] + sorted(df["Periodo"].unique().tolist())
_periodo = st.selectbox("Periodo", options_periodo, index=0)

options_categoria = ['All'] + sorted(df["Categoria"].unique().tolist())
_categoria = st.selectbox("Categoria", options_categoria, index=0)

options_persona = ['All'] + sorted(df["Persona"].unique().tolist())
_persona = st.selectbox("Persona", options_persona, index=0)

# filtering (replace previous df[...] expression)
mask = pd.Series(True, index=df.index)
if _periodo != 'All':
    mask &= df['Periodo'] == _periodo
if _categoria != 'All':
    mask &= df['Categoria'] == _categoria
if _persona != 'All':
    mask &= df['Persona'] == _persona

st.write(style_dataframe(df[mask]))

