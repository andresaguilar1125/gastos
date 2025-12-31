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
    # REVIEW: this looks weird
    df_tabs = df_detailed()[df_detailed()['Fecha'] > '2025-07-01']
else:
    df_tabs = df_grouped()[df_grouped()['Fecha'] > '2025-07-01']

# for debugging
st.expander('df_tabs preview', expanded=False).dataframe(df_tabs)

# Tabs for categories
tabs = st.tabs(["Logs", "Mes", "2025", "Familiar", "Medico", "Recibos", "Restaurantes", "Super", "Viajes"])

with tabs[0]:
    st.write("tab")

with tabs[1]:
    # Table data
    df_tabs[df_tabs['Periodo'] == '2025-12']

    # Chart by Categoria
    # add data labels to bars centered horizontally and vertically
    # remove xaxis title
    # remove yaxis title
    fig = px.bar(
        df_tabs[df_tabs['Periodo'] == '2025-12']\
            .groupby(['Categoria', 'Persona'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Categoria',
        color='Persona',
        barmode='stack',
        orientation='h',
    )

    fig


with tabs[2]:
    # Table data
    df_tabs

    fig1 = px.bar(
        # This isnt helpful or very descriptive, just a bunch of bars on colors stacked by a single category
        # Instead get the difference or variance from last month (up) or (down) and change to a different chart type 
        df_tabs\
            .groupby(['Categoria', 'Periodo'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Categoria',
        color='Periodo',
        barmode='stack',
        orientation='h',
    )

    fig1

with tabs[3]:
    df_familiar = df_tabs[df_tabs['Categoria'] == 'Familiar']
    df_familiar

    fig_fam = px.bar(
        # This is not really helpful, instead group by categoria on xaxis and sum monto for each persona as different colors
        df_familiar\
            .groupby(['Persona', 'Comercio'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Persona',
        color='Comercio',
        barmode='stack',
        orientation='h',
    )

    fig_fam

with tabs[4]:
    df_med = df_tabs[df_tabs['Categoria'] == 'Medico']
    df_med

    fig_med = px.bar(
        # do a small kpi instead shwoing total monto sum by persona
        df_med\
            .groupby(['Persona', 'Comercio'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Persona',
        color='Comercio',
        barmode='stack',
        orientation='h',
    )

    fig_med

with tabs[5]:
    df_rec = df_tabs[df_tabs['Categoria'] == 'Recibos']
    df_rec

    fig_rec = px.bar(
        # do a small kpi about the average monto per comercio
        df_rec\
            .groupby(['Persona', 'Comercio'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Persona',
        color='Comercio',
        barmode='stack',
        orientation='h',
    )

    fig_rec

with tabs[6]:
    df_rest = df_tabs[df_tabs['Categoria'] == 'Restaurantes']
    df_rest

    fig_rest = px.bar(
        # do a small kpi about the total monto sum per comercio substraing the goals each month
        # TODO: implement the goals subtraction
        df_rest\
            .groupby(['Persona', 'Comercio'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Persona',
        color='Comercio',
        barmode='stack',
        orientation='h',
    )

    fig_rest

with tabs[7]:
    df_super_d = df_tabs[df_tabs['Categoria'] == 'Super']
    df_super_d

    fig_super_d = px.bar(
        # from the total monto sum per periodo substract the goal of the limit budget and show the difference month by month
        df_super_d\
            .groupby(['Periodo', 'Comercio'])['Monto']\
            .sum().reset_index(),
        x='Monto',
        y='Periodo',
        color='Comercio',
        barmode='stack',
        orientation='h',
    )

    fig_super_d

with tabs[8]:
    st.write("tab")

    st.dataframe(
        df_tabs[df_tabs['Categoria'] == 'Viajes']
    )