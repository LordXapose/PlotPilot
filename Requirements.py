from setuptools import setup, find_packages

setup(
    name="pyrostat",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pandas", "numpy", "scipy", "matplotlib", 
        "seaborn", "plotly", "streamlit", "openpyxl"
    ],
    entry_points={
        "console_scripts": [
            "pyrostat = scripts.pyrostat_cli:main",
        ]
    },
    author="Kenil4sec",
    description= "toolkit",
)