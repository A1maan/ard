from google.cloud import bigquery

# uv pip install google-cloud-bigquery[pandas]
# google-cloud-bigquery-storage pyarrow

client = bigquery.Client(project="qwiklabs-gcp-01-dd00ff0e4c0d")


# When farmer clicks on their farm in frontend:
from fertilizer import get_fertilizer_recommendations
from crops import get_crop_recommendations

# 1. Get single row from BigQuery
bigquery_row = client.query(f"SELECT * FROM qwiklabs-gcp-01-dd00ff0e4c0d.OSSL.OSSL_with_predictions WHERE row_id = 2").to_dataframe().iloc[0].to_dict()

# 2. Get recommendations
fertilizer_result = get_fertilizer_recommendations(bigquery_row, target_crop="maize")
crops_result = get_crop_recommendations(bigquery_row)

# 3. Pass to LLM as context
llm_context = {
    "farm_fertilizer_analysis": fertilizer_result,
    "farm_crop_analysis": crops_result
}

print(llm_context)