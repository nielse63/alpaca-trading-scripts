# alpaca-trading-scripts

## Setting up Ubuntu

```bash
sudo apt-get update -y
sudo apt-get upgrade -y

# install python 3.9
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt install python3.9 -y

# install venv
sudo apt-get install python3-venv -y --upgrade
.bin/setup
```

## Deploying to production

```bash
# ssh into prod instance
ssh user@123.45.67.8

# pull latest from remote
cd alpaca-trading-scripts
git checkout main
git pull

# re-run production setup
.bin/setup-prod

# some quick validation
source activate
python --version # 3.9.x
python main.py
```
