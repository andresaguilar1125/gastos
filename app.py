import streamlit as st
import pandas as pd
import plotly.express as px
from helpers import df_detailed, df_grouped

st.set_page_config(page_title="GSheet Data Viewer", layout="wide")

# Load dataframe mode
view_mode =st.selectbox(
        label = "View Type",
        options = ["Detailed", "Grouped"],
        index = 1
    )

# Load dataframe with minimal recomputation and proper datetime filtering
if view_mode == "Detailed":
    detailed_df = df_detailed()
    df_tabs = detailed_df[detailed_df['Fecha'] > '2025-07-01']
else:
    grouped_df = df_grouped()
    df_tabs = grouped_df[grouped_df['Fecha'] > '2025-07-01']

# for debugging
st.expander('df_tabs preview', expanded=False).dataframe(df_tabs)

# # Tabs for categories
tabs = st.tabs(["Periodo", "2025", "Familiar", "Medico", "Recibos", "Restaurantes", "Super", "Viajes"])

with tabs[0]:
    #TODO: df_tabs[df_tabs['Periodo'] == '2025-12'] with a st.selectobx
    df_mes = df_tabs[df_tabs['Periodo'] == '2025-12']
    st.write(df_mes.reset_index(drop=True))

    # Metrics
    fam, med, rec, rest, sup, vjs = st.columns(6)
    fam.metric("familiar", "0", "1", border=True)
    med.metric("medico", "0", "1", border=True)
    rec.metric("recibos", "0", "1", border=True)
    rest.metric("restaurantes", "0", "1", border=True)
    sup.metric("super", "0", "1", border=True)
    vjs.metric("viajes", "0", "1", border=True)