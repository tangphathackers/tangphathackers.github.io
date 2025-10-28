document.addEventListener('DOMContentLoaded', () => {
    // --- CƠ SỞ DỮ LIỆU CÁC FILE ---
    // Thêm thuộc tính `category` cho mỗi file để lọc.
    const filesToDownload = [
        {
            imageUrl: 'https://via.placeholder.com/100/7B2CBF/FFFFFF?text=APK',
            title: 'Trình quản lý tệp Pro',
            description: 'Phiên bản Pro của trình quản lý tệp cho thiết bị Android.',
            downloadUrl: 'path/to/your/filemanager.apk',
            fileName: 'FileManagerPro.apk',
            category: 'Ứng dụng'
        },
        {
            imageUrl: 'https://via.placeholder.com/100/3A5A40/FFFFFF?text=PDF',
            title: 'Báo cáo Kinh doanh Q3',
            description: 'Tài liệu báo cáo chi tiết về tình hình kinh doanh quý 3.',
            downloadUrl: 'path/to/your/report.pdf',
            fileName: 'BusinessReport_Q3.pdf',
            category: 'Tài liệu'
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
            title: 'Bộ icon Lập trình',
            description: 'Gói ZIP chứa bộ icon chất lượng cao dành cho lập trình viên.',
            downloadUrl: 'path/to/your/icons.zip',
            fileName: 'DevIcons.zip',
            category: 'Công cụ'
        },
        {
            imageUrl: 'https://via.placeholder.com/100/588157/FFFFFF?text=XLSX',
            title: 'Bảng lương Nhân viên',
            description: 'Bảng tính Excel chứa dữ liệu lương nhân viên tháng này.',
            downloadUrl: 'path/to/your/payroll.xlsx',
            fileName: 'EmployeePayroll.xlsx',
            category: 'Tài liệu'
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
            title: 'Mã nguồn Website',
            description: 'Tải xuống mã nguồn hoàn chỉnh của dự án website này.',
            downloadUrl: 'path/to/your/website-source.zip',
            fileName: 'WebsiteSource.zip',
            category: 'Công cụ'
        },
    ];

    // --- LẤY CÁC PHẦN TỬ HTML ---
    const appGrid = document.getElementById('app-grid');
    const searchInput = document.getElementById('search-input');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    
    let currentFilter = 'Tất cả';

    // --- HÀM HIỂN THỊ CÁC CARD ---
    function displayFiles(files) {
        appGrid.innerHTML = ''; // Xóa nội dung cũ

        if (files.length === 0) {
            appGrid.innerHTML = '<p class="no-results">Không tìm thấy kết quả phù hợp.</p>';
            return;
        }

        files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-content">
                    <img src="${file.imageUrl}" alt="Ảnh bìa cho ${file.title}" class="card-image">
                    <h2 class="card-title">${file.title}</h2>
                    <p class="card-description">${file.description}</p>
                    <a href="${file.downloadUrl}" class="download-btn" download="${file.fileName}">
                        <i class="fa-solid fa-download"></i> Tải xuống
                    </a>
                </div>
            `;
            appGrid.appendChild(card);
        });
    }

    // --- HÀM LỌC VÀ TÌM KIẾM ---
    function filterAndSearch() {
        const searchTerm = searchInput.value.toLowerCase();

        let filteredFiles = filesToDownload;

        // 1. Lọc theo danh mục
        if (currentFilter !== 'Tất cả') {
            filteredFiles = filteredFiles.filter(file => file.category === currentFilter);
        }

        // 2. Lọc theo từ khóa tìm kiếm
        if (searchTerm) {
            filteredFiles = filteredFiles.filter(file => 
                file.title.toLowerCase().includes(searchTerm) || 
                file.description.toLowerCase().includes(searchTerm)
            );
        }

        displayFiles(filteredFiles);
    }

    // --- HÀM TẠO CÁC NÚT LỌC ĐỘNG ---
    function setupFilterButtons() {
        // Lấy tất cả các danh mục duy nhất từ dữ liệu
        const categories = ['Tất cả', ...new Set(filesToDownload.map(file => file.category))];
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            button.dataset.category = category; // Lưu trữ danh mục trong data-attribute
            if (category === 'Tất cả') {
                button.classList.add('active');
            }
            filterButtonsContainer.appendChild(button);
        });
        
        // Thêm sự kiện click cho các nút lọc
        filterButtonsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                // Xóa class 'active' khỏi tất cả các nút
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                // Thêm class 'active' vào nút được click
                e.target.classList.add('active');
                
                currentFilter = e.target.dataset.category;
                filterAndSearch();
            }
        });
    }

    // --- THÊM SỰ KIỆN CHO THANH TÌM KIẾM ---
    searchInput.addEventListener('keyup', filterAndSearch);

    // --- KHỞI TẠO TRANG WEB ---
    setupFilterButtons();
    displayFiles(filesToDownload); // Hiển thị tất cả file lúc ban đầu
});
