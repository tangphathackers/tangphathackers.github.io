document.addEventListener('DOMContentLoaded', () => {
    // Danh sách các file/ứng dụng bạn muốn hiển thị
    // Để thêm file, chỉ cần sao chép một khối {} và thay đổi thông tin
    const filesToDownload = [
        {
            imageUrl: 'https://via.placeholder.com/100/7B2CBF/FFFFFF?text=APK', // Thay bằng link ảnh của bạn
            title: 'Ứng dụng APK Mẫu',
            description: 'Đây là mô tả cho một ứng dụng Android mẫu. An toàn và đã được quét.',
            downloadUrl: 'path/to/your/sample.apk', // Thay bằng link tải file APK của bạn
            fileName: 'SampleApp.apk' // Tên file khi người dùng tải về
        },
        {
            imageUrl: 'https://via.placeholder.com/100/9D4EDD/FFFFFF?text=ZIP',
            title: 'Tệp nén ZIP',
            description: 'Tải xuống tệp nén chứa các tài liệu quan trọng.',
            downloadUrl: 'path/to/your/archive.zip',
            fileName: 'Archive.zip'
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80', // Đây là link ảnh trực tiếp
            title: 'Hình ảnh Thiên nhiên',
            description: 'Tải xuống hình ảnh chất lượng cao về thiên nhiên.',
            downloadUrl: 'https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80',
            fileName: 'NatureImage.jpg'
        },
        // --- Thêm các file khác vào đây ---
        {
            imageUrl: 'https://via.placeholder.com/100/5A189A/FFFFFF?text=FILE',
            title: 'Tài liệu PDF',
            description: 'Một tài liệu hướng dẫn sử dụng ở định dạng PDF.',
            downloadUrl: 'path/to/your/document.pdf',
            fileName: 'Manual.pdf'
        },
    ];

    const appGrid = document.getElementById('app-grid');

    // Hàm để tạo và hiển thị các thẻ tải xuống
    function displayFiles() {
        // Xóa nội dung cũ để tránh trùng lặp
        appGrid.innerHTML = ''; 

        filesToDownload.forEach(file => {
            // Tạo thẻ div chính
            const card = document.createElement('div');
            card.className = 'card';

            // Tạo nội dung bên trong thẻ
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';

            // Tạo ảnh thumbnail
            const image = document.createElement('img');
            image.src = file.imageUrl;
            image.alt = `Ảnh bìa cho ${file.title}`;
            image.className = 'card-image';

            // Tạo tiêu đề
            const title = document.createElement('h2');
            title.className = 'card-title';
            title.textContent = file.title;

            // Tạo mô tả
            const description = document.createElement('p');
            description.className = 'card-description';
            description.textContent = file.description;

            // Tạo nút tải xuống
            const downloadLink = document.createElement('a');
            downloadLink.href = file.downloadUrl;
            downloadLink.textContent = 'Tải xuống';
            downloadLink.className = 'download-btn';
            
            // Thuộc tính 'download' quan trọng để trình duyệt tải file về thay vì điều hướng
            downloadLink.setAttribute('download', file.fileName);

            // Gắn các phần tử con vào nội dung thẻ
            cardContent.appendChild(image);
            cardContent.appendChild(title);
            cardContent.appendChild(description);
            cardContent.appendChild(downloadLink);

            // Gắn nội dung vào thẻ chính
            card.appendChild(cardContent);
            
            // Gắn thẻ chính vào lưới hiển thị
            appGrid.appendChild(card);
        });
    }

    // Gọi hàm để hiển thị các file
    displayFiles();
});
