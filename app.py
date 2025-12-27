"""
Minimal Streamlit expense tracker demo for the `gastos` project.
Run: pip install -r requirements.txt
     streamlit run streamlit_app.py
"""

import streamlit as st
import pandas as pd
from datetime import date

st.set_page_config(page_title="Gastos (Expenses)", layout="centered")

st.title("Gastos — Simple Expense Tracker")

# Initialize session state to store expenses in-memory
if "expenses" not in st.session_state:
    st.session_state.expenses = []

with st.form("add_expense", clear_on_submit=True):
    col1, col2 = st.columns(2)
    with col1:
        d = st.date_input("Date", value=date.today())
        cat = st.selectbox("Category", ["Food", "Transport", "Rent", "Utilities", "Other"])
    with col2:
        amt = st.number_input("Amount", min_value=0.0, step=0.5, format="%.2f")
        desc = st.text_input("Description")

    submitted = st.form_submit_button("Add expense")
    if submitted:
        st.session_state.expenses.append({
            "date": d,
            "category": cat,
            "amount": float(amt),
            "description": desc,
        })
        st.success("Expense added")

st.write("---")

if st.session_state.expenses:
    df = pd.DataFrame(st.session_state.expenses)
    df["date"] = pd.to_datetime(df["date"])  # ensure datetime for sorting

    st.subheader("Expenses")
    st.dataframe(df.sort_values("date", ascending=False))

    st.subheader("Total by category")
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    st.bar_chart(totals)

    st.metric("Total spent", f"${df['amount'].sum():.2f}")
else:
    st.info("No expenses yet — add some using the form above.")

st.sidebar.header("About")
st.sidebar.write("A tiny demo Streamlit app for tracking simple expenses.")
