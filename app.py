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

# Load dataframe
if view_mode == "Detailed":
    df_tabs = df_detailed()
else:
    df_tabs = df_grouped()

# for debugging
st.expander('df_tabs preview', expanded=False).dataframe(df_tabs)

# Tabs for categories
tabs = st.tabs(["Logs", "Mes", "2025", "Familiar", "Medico", "Recibos", "Restaurantes", "Super", "Viajes"])

with tabs[0]:
    st.write("tab")

with tabs[1]:
    st.write("tab")
    st.dataframe(
        df_tabs[df_tabs['Periodo'] == '2025-12']
    )

    fig = px.histogram(
        df_tabs[df_tabs['Periodo'] == '2025-12'],
        x='Categoria',
        y='Monto',
        title='Monto by Categoria for 2025-12',
        labels={'Monto': 'Total Monto', 'Categoria': 'Categoria'},
        histfunc='sum'
    )

    fig






with tabs[2]:
    st.write("tab")

with tabs[3]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Familiar']
    )

with tabs[4]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Medico']
    )
with tabs[5]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Recibos']
    )

with tabs[6]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Restaurantes']
    )

with tabs[7]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Super']
    )

with tabs[8]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Viajes']
    )