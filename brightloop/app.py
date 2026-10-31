from flask import Flask
from flask_cors import CORS
from pymongo.errors import PyMongoError

from routes.product_routes import product_bp
from routes.plan_routes import plan_bp
from routes.quotation_routes import quotation_bp
from routes.subscription_routes import subscription_bp
from routes.discount_routes import discount_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(product_bp, url_prefix="/api/products")
app.register_blueprint(plan_bp, url_prefix="/api/plans")
app.register_blueprint(quotation_bp, url_prefix="/api/quotations")
app.register_blueprint(subscription_bp, url_prefix="/api/subscriptions")
app.register_blueprint(discount_bp, url_prefix="/api/discounts")


@app.route("/")
def home():
    return {"message": "Brightloop Flask API running"}


@app.errorhandler(PyMongoError)
def handle_database_error(error):
    app.logger.exception("MongoDB request failed", exc_info=error)
    return {"error": "Database operation failed"}, 503


if __name__ == "__main__":
    app.run(debug=True, port=5000)