import os
import glob
import numpy as np
import pandas as pd
from scipy import stats

def mean_std_ci_var(data, confidence=0.95):
    data = np.array(data)
    data = data[~np.isnan(data)]
    n = len(data)
    mean = np.mean(data)
    std = np.std(data, ddof=1)
    var = np.var(data, ddof=1)
    se = std / np.sqrt(n)
    t_crit = stats.t.ppf((1 + confidence) / 2, df=n-1)
    ci_low = mean - t_crit * se
    ci_high = mean + t_crit * se
    return (mean, std, var, (ci_low, ci_high))

def analyze_folder(folder):
    print(f"\n=== Analyzing {folder} ===")
    files = glob.glob(os.path.join(folder, "results-*-*.csv"))
    metrics = set()
    browsers = set()
    for f in files:
        parts = os.path.basename(f).split('-')
        if len(parts) >= 4:
            metrics.add(parts[1])
            browsers.add(parts[-1].replace('.csv', ''))
    metrics = sorted(metrics)
    browsers = sorted(browsers)

    frameworks = [('NextjsApplication', 'Next.js'), ('BlazorWASMApplication', 'Blazor WASM')]

    columns = []
    for fw_code, fw_name in frameworks:
        for browser in browsers:
            columns.append(f"{fw_name} ({browser}) CI")
            columns.append(f"{fw_name} ({browser}) Variance")
    for browser in browsers:
        columns.append(f"Paired t-stat ({browser})")
        columns.append(f"p-value ({browser})")

    table = []
    for metric in metrics:
        row = [metric.upper()]

        ci_dict = {}
        var_dict = {}
        data_dict = {}
        for fw_code, fw_name in frameworks:
            for browser in browsers:
                fname = os.path.join(folder, f"results-{metric}-{fw_code}-{browser}.csv")
                if os.path.exists(fname):
                    data = np.loadtxt(fname)
                    mean, std, var, ci = mean_std_ci_var(data)
                    ci_str = f"{mean:.2f} [{ci[0]:.2f}, {ci[1]:.2f}]"
                    row.append(ci_str)
                    row.append(f"{var:.2f}")
                    ci_dict[(fw_code, browser)] = ci_str
                    var_dict[(fw_code, browser)] = var
                    data_dict[(fw_code, browser)] = data
                else:
                    row.append("")
                    row.append("")
                    ci_dict[(fw_code, browser)] = ""
                    var_dict[(fw_code, browser)] = ""
                    data_dict[(fw_code, browser)] = None

        for browser in browsers:
            d1 = data_dict[('NextjsApplication', browser)]
            d2 = data_dict[('BlazorWASMApplication', browser)]
            if d1 is not None and d2 is not None:
                min_len = min(len(d1), len(d2))
                d1 = d1[:min_len]
                d2 = d2[:min_len]
                t_stat, p_val = stats.ttest_ind(d1, d2, equal_var=False) 
                row.append(f"{t_stat:.3f}")
                row.append(f"{p_val:.3g}")
            else:
                row.append("")
                row.append("")
        table.append(row)

    out_file = os.path.join(folder, "statistical_analysis_structured.csv")
    df = pd.DataFrame(table, columns=["Metric"] + columns)
    df.to_csv(out_file, index=False, sep=',')
    print(f"Saved structured results to {out_file}")

def main():
    for folder in os.listdir('.'):
        if os.path.isdir(folder) and folder.endswith('-test'):
            analyze_folder(folder)

if __name__ == '__main__':
    main() 