# create a foo to style a given dataframe
def style_dataframe(df):

    # keep only relevant columns
    df = df[['Fecha', 'Comercio', 'Monto', 'Categoria', 'Persona']]

    return df.style.format({
        'Monto': '{:,.0f}',
        'Fecha': lambda t: t.strftime("%m/%d/%y %I:%M %p"),
    })