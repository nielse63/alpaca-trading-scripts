from pathlib import Path

from setuptools import setup

from trading_scripts import __version__


# Utility function to read the README file.
# Used for the long_description.  It's nice, because now 1) we have a top level
# README file and 2) it's easier to type in the README file than to put a raw
# string in below ...
def read(fname="README.md"):
    return open(Path(__file__).parent / fname).read()


def read_requirements(filename):
    with open(filename) as f:
        return f.read().splitlines()


settings = dict(
    name="alpaca-trading-scripts",
    packages=["trading_scripts"],
    version=__version__,
    author="Erik Nielsen",
    author_email="erik@312development.com",
    description=("Python trading scripts"),
    license="MIT",
    keywords="alpaca",
    url="https://github.com/nielse63/alpaca-trading-scripts",
    long_description=read("README.md"),
    long_description_content_type="text/markdown",
    python_requires=">=3.9",
    install_requires=read_requirements("requirements.txt"),
    # tests_require=read_requirements("requirements-dev.txt"),
    classifiers=[
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: Implementation :: PyPy",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
    ],
)


if __name__ == "__main__":
    setup(**settings)
