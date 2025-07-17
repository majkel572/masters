import sys
import numpy as np
import matplotlib.pyplot as plt

def plot_results(csv_file):
    data = np.loadtxt(csv_file)
    x = np.arange(1, len(data) + 1)
    plt.figure(figsize=(10, 5))
    plt.plot(x, data, marker='o', linestyle='-', markersize=2)
    plt.xlabel('Test Number')
    plt.ylabel('ms')
    plt.title(f'Results from {csv_file}')
    plt.grid(True)
    plt.tight_layout()
    plt.show()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python plot_results.py <csv_file>")
    else:
        plot_results(sys.argv[1]) 