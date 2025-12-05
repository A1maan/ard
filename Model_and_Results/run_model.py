from run_model_setup import *

test_csv_path = r"ossl_test_union.csv"
pipeline_path = r"C:\Users\SAADB\Desktop\Python_Code\Google_Hackathon\Model_and_Results\ossl_per_target_pipeline.pkl"

results = predict_samples_from_test_csv(
    test_csv_path=test_csv_path,
    pipeline_path=pipeline_path,
    n_samples=3,
    random_state=42,  # or None
)

# Inspect predictions for one sample:
first_idx = next(iter(results.keys()))
pprint(results[first_idx])