"""
Minimal Streamlit expense tracker demo for the `gastos` project.
Run: pip install -r requirements.txt
     streamlit run streamlit_app.py
"""

import streamlit as st
import pandas as pd
from datetime import date
from data.gsheets import transform_gsheet, load_gsheet

st.write(transform_gsheet(load_gsheet()))
