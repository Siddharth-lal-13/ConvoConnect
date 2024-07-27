from flask import Flask, render_template, jsonify, request, flash, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, current_user, UserMixin, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String
import google.generativeai as genai
import os

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("FLASK_KEY")
WEB_RTC_API = os.environ.get("AGORA_API")

# Configure Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return db.get_or_404(User, user_id)


user_home = os.path.expanduser('~')
upload_folder = os.path.join(user_home, 'recordings')
if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)
app.config['UPLOAD_FOLDER'] = upload_folder


# ---------------------------------------- DATABASE -------------------------------------------------------

# CREATE DATABASE
class Base(DeclarativeBase):
    pass


app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DB_URI', 'sqlite:///recording-data.db')
db = SQLAlchemy(model_class=Base)
db.init_app(app)


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(100))

    session_records = relationship('SessionRecord', back_populates='user')


class SessionRecord(db.Model):
    __tablename__ = 'session_records'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    channel_name: Mapped[str] = mapped_column(String, nullable=False)
    video_link: Mapped[str] = mapped_column(String, nullable=False)
    participants: Mapped[str] = mapped_column(String, nullable=False)
    messages: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, db.ForeignKey('users.id'), nullable=True)

    user = relationship('User', back_populates='session_records')


with app.app_context():
    db.create_all()

# ----------------------------------------- AI LOGIC ------------------------------------------------------

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(model_name='gemini-1.5-flash', generation_config=genai.GenerationConfig(
    max_output_tokens=500,
    temperature=0.1,
))


# Function to replace the substring between sub1 and sub2 including the markers
def replace_between_markers(s, start_marker, end_marker, replacement_func):
    start_idx = 0
    while True:
        try:
            start_idx = s.index(start_marker, start_idx)
            end_idx = s.index(end_marker, start_idx + len(start_marker))
            content = s[start_idx + len(start_marker):end_idx]
            formatted_content = replacement_func(content)
            s = s[:start_idx] + formatted_content + s[end_idx + len(end_marker):]
            # Move start_idx past the newly inserted content
            start_idx = start_idx + len(formatted_content)
        except ValueError:
            break
    return s


# Function to format the content
def format_content(content):
    return "<strong>" + content + "</strong>"


def replace_stars_with_bold_numbers(s):
    # Find all the positions of '*'
    star_positions = [i for i, char in enumerate(s) if char == '*']

    # Replace '*' with unique numbers wrapped in <strong> tags
    num = 1
    s_list = list(s)  # Convert string to list for mutable operations
    for pos in star_positions:
        s_list[pos] = f"<strong>{num}</strong>"
        num += 1

    # Join the list back into a string
    return ''.join(s_list)


# ----------------------------------------- ROUTES -------------------------------------------------

@app.route("/")
def home():
    if current_user.is_authenticated:
        # Fetch recorded sessions for the logged-in user
        user_sessions = db.session.query(SessionRecord).filter_by(user_id=current_user.id).all()
    else:
        user_sessions = []

    return render_template("lobby.html", logged_in=current_user.is_authenticated, user_sessions=user_sessions,
                           directory=upload_folder)


@app.route('/auth')
def auth():
    return render_template('auth.html')


@app.route('/register', methods=["POST"])
def register():
    if request.method == "POST":
        email = request.form.get('email')
        result = db.session.execute(db.select(User).where(User.email == email))
        # Note, email in db is unique so will only have one result.
        user = result.scalar()
        if user:
            # User already exists
            flash("You've already signed up with that email, try again or log in instead!")
            return redirect(url_for('auth'))

        hash_and_salt_password = generate_password_hash(
            request.form.get("password"),
            method="pbkdf2:sha256",
            salt_length=8
        )
        new_user = User(
            name=request.form.get("name"),
            email=request.form.get("email"),
            password=hash_and_salt_password,
        )
        db.session.add(new_user)
        db.session.commit()

        login_user(new_user)
        return redirect(url_for("home"))


@app.route('/login', methods=['POST'])
def login():
    if request.method == "POST":
        email = request.form.get('email')
        password = request.form.get('password')

        # Find user by email entered.
        result = db.session.execute(db.select(User).where(User.email == email))
        user = result.scalar()
        if not user:
            flash("That email does not exists, please try again or register as new user.")
            return redirect(url_for('auth'))

        elif not check_password_hash(user.password, password):
            flash('Password incorrect, please try again.')
            return redirect(url_for('auth'))

        else:
            login_user(user)
            return redirect(url_for('home'))
    return jsonify({'message': 'Invalid credentials'}), 400


@app.route("/room/<invite_code>")
def room(invite_code):
    return render_template("room.html", invite_code=invite_code, api=WEB_RTC_API)


@app.route('/api/bot-response', methods=['POST'])
def bot_response():
    user_message = request.json.get('message')
    print(user_message)

    if "jarvis!" in user_message.lower():
        user_message += " please write in short concise points."
        print(user_message)

        chat = model.start_chat(history=[])

        response = chat.send_message(user_message)

        print(response.text)

        ai_format = response.text
        sub1 = "**"
        sub2 = "**"

        formatted_text1 = replace_between_markers(ai_format, sub1, sub2, format_content)
        formatted_text2 = replace_stars_with_bold_numbers(formatted_text1)

        print(formatted_text2)

        bot_message = formatted_text2
        return jsonify({'bot_message': bot_message})
    else:
        return jsonify({'error': 'Failed to get response from Gemini API'}), 500


@app.route('/upload-video', methods=['POST'])
@login_required
def upload_video():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'message': 'File uploaded successfully', 'file_path': filepath})


@app.route('/record-session', methods=['POST'])
@login_required
def record_session():
    data = request.get_json()
    channel_name = data['channel_name']
    video_link = data['video_link']
    participants = data['participants']
    messages = data['messages']

    new_record = SessionRecord(
        channel_name=channel_name,
        video_link=video_link,
        participants=participants,
        messages=messages,
        user_id=current_user.id
    )
    db.session.add(new_record)
    db.session.commit()

    return jsonify({'message': 'Session recorded successfully'})


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(debug=False)
