"""
Thermaltake LEDFanBox Controller - Setup Script
"""

from setuptools import setup, find_packages

setup(
    name="thermaltake-ledfanbox",
    version="1.0.0",
    description="Python tool to control Thermaltake LEDFanBox fan speed and RGB lighting",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Brad Mills (@BikeGuy07)",
    url="https://github.com/MillsAirCode/thermaltake-ledfanbox",
    license="Apache License 2.0",
    python_requires=">=3.8",
    packages=find_packages(),
    install_requires=[
        "hidapi>=0.14.0",
    ],
    entry_points={
        "console_scripts": [
            "thermaltake-ledfanbox=thermaltake_ledfanbox:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: POSIX :: Linux",
        "Operating System :: MacOS :: MacOS X",
        "Operating System :: Microsoft :: Windows",
    ],
    keywords="thermaltake ledfanbox fan control rgb hidapi",
    project_urls={
        "Bug Reports": "https://github.com/MillsAirCode/thermaltake-ledfanbox/issues",
        "Source": "https://github.com/MillsAirCode/thermaltake-ledfanbox",
    },
)
