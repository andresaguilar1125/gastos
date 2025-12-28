import streamlit as st
import pandas as pd
from datetime import date
from data.gsheets import transform_gsheet, load_gsheet

st.set_page_config(page_title="GSheet Data Viewer", layout="wide")

df = transform_gsheet(load_gsheet())

with st.sidebar:
    st.title("Gastos")

    _periodo = st.selectbox(
        "Periodo",
     #    options=df["Periodo"].unique().tolist()
     options=[0,1,2]
    )

    _categoria = st.selectbox(
        "Categoria",
        options=df["Categoria"].unique().tolist()
    )

    _persona = st.selectbox(
        "Persona",
        options=df["Persona"].unique().tolist()
    )

st.write(df)

