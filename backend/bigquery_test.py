from google.cloud import bigquery

# uv pip install google-cloud-bigquery[pandas]
# google-cloud-bigquery-storage pyarrow

client = bigquery.Client(project="qwiklabs-gcp-01-dd00ff0e4c0d")


query = """
SELECT *
FROM `qwiklabs-gcp-01-dd00ff0e4c0d.OSSL.OSSL_Data`
WHERE scan_visnir_1100_ref IS NOT NULL
LIMIT 20
"""

df = client.query(query).to_dataframe()
print(df.head())
