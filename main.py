from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("lobby.html")

@app.route("/room/<invite_code>")
def room(invite_code):
    return render_template("room.html", invite_code=invite_code)

if __name__ == "__main__":
    app.run(debug=True)