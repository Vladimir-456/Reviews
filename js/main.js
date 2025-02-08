const form = document.querySelector('form');
const input = document.querySelector('input[name="comment"]');
const commentContainer = document.querySelector('.comments');
const templateData = document.querySelector('#comment-template').content;
const commentCount = document.querySelector('#comment-count span');
const loadComment = document.querySelector('.load_comment__btn');
const fileUpload = document.querySelector('#file-upload');
const previewContainer = document.querySelector('.image-preview');
const modal = document.querySelector('#imageModal');
const modalImage = document.querySelector('#modalImage');
const closeBtn = document.querySelector('.close');
const images = document.querySelectorAll('.comment-img img');

let selectedImage = null; 
let abortController = new AbortController();
let offset = 0;
const limit = 5;
let isLoading = false;

const API_URL = 'https://reviews-2-3xs8.onrender.com/comments';
const DEFAULT_AVATAR = './img/male-person-silhouette-strict-suit-side-view-shadow-back-lit-white-background.jpg';

const loadingIndicator = document.createElement('div');
loadingIndicator.classList.add('loading');
loadingIndicator.textContent = 'Загрузка комментариев...';
document.body.appendChild(loadingIndicator);

const countComments = () => {
    commentCount.textContent = commentContainer.querySelectorAll('.comment').length;
};

function loadComments() {
    isLoading = true;
    loadingIndicator.style.display = 'block';

    fetch(`${API_URL}?limit=${limit}&offset=${offset}`)
        .then(response => response.json())
        .then(data => {
            loadingIndicator.style.display = 'none';
            if (data.length < limit) {
                loadComment.style.display = 'none';
            }

            data.forEach(commentData => {
                addComments(commentData.text, commentData.username, DEFAULT_AVATAR, commentData.img, commentData.relativeTime);
            });

            offset += data.length;
            countComments();
        })
        .catch(err => {
            console.error('Ошибка загрузки комментариев:', err);
            loadingIndicator.style.display = 'none';
        })
        .finally(() => {
            isLoading = false;
        });
}

// Функция для получения комментариев с сервера
const fetchComments = () => {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            commentContainer.innerHTML = '';
            data.forEach(comment => {
                addComments(comment.text, comment.username, DEFAULT_AVATAR, comment.img, comment.relativeTime);
            });
            countComments();
        })
        .catch(err => console.error('Ошибка загрузки комментариев:', err));
};


const addComments = (text, username = 'Анонимус', avatar = DEFAULT_AVATAR, img = null, time) => {
    const comment = templateData.cloneNode(true);
    const commentElement = comment.firstElementChild;
    commentElement.querySelector('.avatar').src = avatar;
    commentElement.querySelector('.username').textContent = username;
    commentElement.querySelector('.time').textContent = time;
    commentElement.querySelector('.comment-text').textContent = text;

    if (img) {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.alt = 'Картинка пользователя';
        imgElement.classList.add('comment-image');
        commentElement.querySelector('.comment-img').appendChild(imgElement);
    }

    // commentContainer.prepend(commentElement);
    commentContainer.appendChild(commentElement);

};

// Обработка отправки формы
form.addEventListener('submit', function(e) {
    e.preventDefault(); 
    const commentText = input.value.trim();
    if (commentText) {
        if(commentText.length < 5) {
            alert('Комментарий должен содержать не менее 5 символов');
            return;
        }

        const formData = new FormData;
        formData.append('username', 'Анонимус');
        formData.append('text', commentText);

        if(fileUpload.files[0]) {
            formData.append('image', fileUpload.files[0]);
        }
    
        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            // Можно добавить комментарий в DOM на основе ответа сервера
            addComments(result.text, result.username, DEFAULT_AVATAR, result.img);
            input.value = '';
            selectedImage = null;
            fileUpload.value = '';
            previewContainer.innerHTML = '';
            countComments();
            showComments();
        })
        .catch(err => console.error('Ошибка при добавлении комментария:', err));
    }
});


const fileUploadHandler = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            selectedImage = e.target.result; 
            previewContainer.innerHTML = '';

            const imgPreview = document.createElement('img');
            imgPreview.src = selectedImage;
            imgPreview.alt = 'Предпросмотр изображения';
            imgPreview.classList.add('preview-image');

            const removeImgPreview = document.createElement('button');
            removeImgPreview.textContent = 'Удалить';
            removeImgPreview.classList.add('remove-btn');

            removeImgPreview.addEventListener('click', () => {
                selectedImage = null;
                fileUpload.value = '';
                previewContainer.innerHTML = '';
                // Создаём новый AbortController и вешаем обработчик заново
                abortController = new AbortController();
                fileUpload.addEventListener('change', fileUploadHandler, { signal: abortController.signal });
            });

            previewContainer.appendChild(imgPreview);
            previewContainer.appendChild(removeImgPreview);
            // После загрузки файла отменяем обработчик
            abortController.abort();
        };
        reader.readAsDataURL(file);
    }
};

fileUpload.addEventListener('change', fileUploadHandler, { signal: abortController.signal });

loadComment.addEventListener('click', (e) => {
    e.preventDefault();
    loadComments();
})
loadComments()


document.addEventListener('DOMContentLoaded', () => {

    // Делегирование событий для динамически добавленных элементов
    document.body.addEventListener('click', (event) => {
        if (event.target.closest('.comment-img img')) {
            modal.style.display = 'block';
            modalImage.src = event.target.src;
            document.body.style.overflow = 'hidden';
        }
    });

        // Закрытие окна по кнопке
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });

    // Закрытие окна при клике вне контента
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });


});