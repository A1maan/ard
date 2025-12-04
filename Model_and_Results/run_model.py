from run_model_setup import *

results = predict_samples_from_test_csv(
    test_csv_path=test_csv_path,
    pipeline_path=pipeline_path,
    n_samples=3,
    random_state=42,  # or None
)

# Inspect predictions for one sample:
first_idx = next(iter(results.keys()))
pprint(results[first_idx])