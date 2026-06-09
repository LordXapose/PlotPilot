PlotPilot/
├── .github/
│   └── workflows/           # CI/CD (automatic testing)
│       └── test.yml
├── pyrostat/                # Main package
│   ├── __init__.py
│   ├── data_explorer.py
│   ├── descriptive.py
│   ├── visualizer.py
│   ├── distributions.py
│   ├── inference.py
│   └── dashboard.py         # Streamlit / Gradio app
├── tests/                   # Unit tests (because pros test)
│   ├── test_explorer.py
│   └── ...
├── examples/                # Jupyter notebooks & sample data
│   ├── iris_demo.ipynb
│   └── customer_churn.csv
├── docs/                    # Sphinx or MkDocs (bad ass docs)
│   └── index.md
├── scripts/                 # CLI entry point
│   └── pyrostat_cli.py
├── requirements.txt
├── setup.py                 # Installable package
├── README.md                # Badges, screenshots, quick start
├── LICENSE                  (MIT or GPL)
├── .gitignore
└── CONTRIBUTING.md