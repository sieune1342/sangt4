const API_URL = "http://localhost:3000";

// =======================================================
// PHẦN 1: POSTS MANAGEMENT (Xoá mềm, Auto ID)
// =======================================================

async function LoadData() {
    let res = await fetch(`${API_URL}/posts`);
    let posts = await res.json();
    let body = document.getElementById("body_table");
    body.innerHTML = '';
    
    for (const post of posts) {
        // Kiểm tra xem post đã bị xóa mềm chưa
        const isDeleted = post.isDeleted === true;
        // Áp dụng class css nếu đã xóa
        const rowClass = isDeleted ? 'deleted-row' : '';
        const statusText = isDeleted ? 'Deleted' : 'Active';
        
        // Nếu đã xoá mềm thì nút Delete có thể ẩn đi hoặc đổi thành Restore (tuỳ logic),
        // ở đây mình vẫn để nút Delete nhưng disable nó hoặc giữ nguyên.
        
        body.innerHTML += `<tr class="${rowClass}">
            <td>${post.id}</td>
            <td>${post.title}</td>
            <td>${post.views}</td>
            <td>${statusText}</td>
            <td>
                <input type="submit" value="Soft Delete" 
                       onclick="DeletePost('${post.id}')" 
                       class="btn-red" ${isDeleted ? 'disabled' : ''}/>
            </td>
        </tr>`;
    }
}

// Hàm hỗ trợ: Lấy Max ID và trả về ID mới (dạng chuỗi)
async function generateNewId(resource) {
    let res = await fetch(`${API_URL}/${resource}`);
    let items = await res.json();
    
    let maxId = 0;
    items.forEach(item => {
        // Chuyển ID chuỗi sang số để so sánh
        let currentId = parseInt(item.id);
        if (!isNaN(currentId) && currentId > maxId) {
            maxId = currentId;
        }
    });
    return (maxId + 1).toString();
}

async function SavePost() {
    let id = document.getElementById("id_txt").value.trim();
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("view_txt").value;

    // Logic: Nếu ô ID rỗng => TẠO MỚI (Auto ID). Nếu có ID => CẬP NHẬT.
    
    if (id === "") {
        // --- CREATE NEW (POST) ---
        try {
            let newId = await generateNewId('posts'); // Tự động tăng ID
            
            let res = await fetch(`${API_URL}/posts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newId,
                    title: title,
                    views: views,
                    isDeleted: false // Mặc định chưa xóa
                })
            });
            if (res.ok) console.log("Create Post Success");
        } catch (error) { console.log(error); }

    } else {
        // --- UPDATE EXISTING (PUT) ---
        // Kiểm tra xem ID có tồn tại không
        let checkRes = await fetch(`${API_URL}/posts/${id}`);
        if (checkRes.ok) {
            // Lấy dữ liệu cũ để giữ lại trường isDeleted nếu cần, 
            // hoặc update đè lên (ở đây mình giả sử update sẽ set lại isDeleted về false hoặc giữ nguyên)
            // Đơn giản nhất là PUT đè lên.
            let res = await fetch(`${API_URL}/posts/${id}`, {
                method: "PUT", // Hoặc PATCH
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title,
                    views: views,
                    isDeleted: false // Khi update thì có thể coi như active lại, hoặc cần logic khác
                })
            });
            if (res.ok) console.log("Update Post Success");
        } else {
            alert("ID không tồn tại để cập nhật!");
        }
    }
    
    LoadData();
    // Clear inputs
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("view_txt").value = "";
}

// Xoá mềm: Sử dụng PATCH để cập nhật isDeleted: true
async function DeletePost(id) {
    if(!confirm("Bạn có chắc muốn xoá mềm bài viết này?")) return;

    let res = await fetch(`${API_URL}/posts/${id}`, {
        method: 'PATCH', // Chỉ cập nhật 1 trường
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            isDeleted: true
        })
    });
    
    if (res.ok) console.log("Soft Delete Success");
    LoadData();
}

// =======================================================
// PHẦN 2: COMMENTS MANAGEMENT (CRUD Full)
// =======================================================

async function LoadComments() {
    let res = await fetch(`${API_URL}/comments`);
    let comments = await res.json();
    let body = document.getElementById("comment_body_table");
    body.innerHTML = '';
    
    for (const cmt of comments) {
        body.innerHTML += `<tr>
            <td>${cmt.id}</td>
            <td>${cmt.text}</td>
            <td>${cmt.postId}</td>
            <td>
                <input type="button" value="Edit" onclick="FillComment('${cmt.id}')">
                <input type="button" value="Delete" class="btn-red" onclick="DeleteComment('${cmt.id}')">
            </td>
        </tr>`;
    }
}

// Hỗ trợ điền dữ liệu lên form để sửa
async function FillComment(id) {
    let res = await fetch(`${API_URL}/comments/${id}`);
    if(res.ok){
        let cmt = await res.json();
        document.getElementById("cmt_id_txt").value = cmt.id;
        document.getElementById("cmt_text_txt").value = cmt.text;
        document.getElementById("cmt_postid_txt").value = cmt.postId;
    }
}

async function SaveComment() {
    let id = document.getElementById("cmt_id_txt").value.trim();
    let text = document.getElementById("cmt_text_txt").value;
    let postId = document.getElementById("cmt_postid_txt").value;

    if (id === "") {
        // --- CREATE COMMENT ---
        let newId = await generateNewId('comments');
        await fetch(`${API_URL}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: newId, text: text, postId: postId })
        });
    } else {
        // --- UPDATE COMMENT ---
        let check = await fetch(`${API_URL}/comments/${id}`);
        if(check.ok){
            await fetch(`${API_URL}/comments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text, postId: postId })
            });
        } else {
            alert("Comment ID không tồn tại");
        }
    }
    LoadComments();
    // Clear inputs
    document.getElementById("cmt_id_txt").value = "";
    document.getElementById("cmt_text_txt").value = "";
    document.getElementById("cmt_postid_txt").value = "";
}

async function DeleteComment(id) {
    if(!confirm("Xoá vĩnh viễn comment này?")) return;
    
    await fetch(`${API_URL}/comments/${id}`, {
        method: 'DELETE' // Xoá cứng đối với comment (theo yêu cầu đề bài chỉ nói xoá mềm post)
    });
    LoadComments();
}

// =======================================================
// INIT
// =======================================================
LoadData();     // Load Posts
LoadComments(); // Load Comments