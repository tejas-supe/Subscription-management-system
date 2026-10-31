import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("DATABASE_NAME", "brightloop")]

products = db["products"]
plans = db["plans"]
quotations = db["quotations"]
subscriptions = db["subscriptions"]
discounts = db["discounts"]
