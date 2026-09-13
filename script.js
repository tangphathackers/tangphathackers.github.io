/**
 * NGHỊCH THỦY HÀN MOBILE - DAMAGE CALCULATION ENGINE & SUITE
 * Tích hợp: LocalStorage Persistence, Multi-profile, Baseline Comparison & URL Share
 */

// 1. Hệ thống Hằng Số Cốt Lõi
const SYSTEM_CONSTANTS = {
    ARMOR: 2860,            // Hằng số giảm thương giáp: 2860 / (Giáp + 2860)
    ELEMENT_RES: 530,       // Hằng số giảm thương nguyên tố: 530 / (Kháng + 530)
    CRIT_CURVE: 938,        // Hằng số đường cong bạo kích: (1.15 * X) / (X + 938)
    SUPPRESSION_MIN: 0.65,  // Chặn đáy khắc phái (nhận tối thiểu 65% ST)
    SUPPRESSION_MAX: 1.25   // Chặn trần khắc phái (khuếch đại tối đa 125%)
};

// 2. Danh mục Input Fields để Save/Load
const FORM_FIELDS = [
    'atk_base', 'atk_skill', 'atk_defbreak', 'atk_ignore_def_pct', 'atk_element',
    'atk_element_penetration', 'atk_crit', 'atk_crit_dmg_pct', 'atk_hit',
    'atk_boss_slayer', 'atk_shield_break', 'def_armor', 'def_elem_res',
    'def_crit_res', 'def_block', 'def_boss_res', 'def_qi_shield',
    'def_perfect_block_pct', 'def_dmg_reduction_pct', 'mul_skill_pct',
    'mul_boss_pct', 'mul_enhance_pct', 'mul_indep1_pct', 'mul_indep2_pct'
];

// 3. Presets Mục Tiêu Chuẩn Thực Tế
const PRESETS = {
    target_131_heroic: {
        def_armor: 5550, def_elem_res: 76, def_crit_res: 1098, def_block: 900,
        def_boss_res: 3000, def_qi_shield: 586, def_perfect_block_pct: 0, def_dmg_reduction_pct: 0
    },
    target_132_heroic: {
        def_armor: 5550, def_elem_res: 80, def_crit_res: 1200, def_block: 1050,
        def_boss_res: 3300, def_qi_shield: 600, def_perfect_block_pct: 0, def_dmg_reduction_pct: 0
    },
    target_pvp_tank_4piece: {
        def_armor: 5200, def_elem_res: 650, def_crit_res: 1600, def_block: 900,
        def_boss_res: 2800, def_qi_shield: 3000, def_perfect_block_pct: 5, def_dmg_reduction_pct: 10
    },
    target_pvp_tank_6piece: {
        def_armor: 5860, def_elem_res: 750, def_crit_res: 1800, def_block: 950,
        def_boss_res: 4200, def_qi_shield: 3800, def_perfect_block_pct: 10, def_dmg_reduction_pct: 15
    },
    target_pvp_squishy: {
        def_armor: 2800, def_elem_res: 120, def_crit_res: 700, def_block: 600,
        def_boss_res: 500, def_qi_shield: 1200, def_perfect_block_pct: 0, def_dmg_reduction_pct: 0
    }
};

// Biến lưu mốc so sánh (Baseline Comparison)
let baselineDamage = null;
let lastCalculatedResult = null;

// ==========================================
// THUẬT TOÁN TÍNH TOÁN SÁT THƯƠNG CHÍNH
// ==========================================
function runEngine() {
    // 1. Nhận dữ liệu đầu vào
    const atk_base = parseFloat(document.getElementById('atk_base').value) || 0;
    const atk_skill = parseFloat(document.getElementById('atk_skill').value) || 0;
    const atk_defbreak = parseFloat(document.getElementById('atk_defbreak').value) || 0;
    const atk_ignore_def_pct = (parseFloat(document.getElementById('atk_ignore_def_pct').value) || 0) / 100;
    const atk_element = parseFloat(document.getElementById('atk_element').value) || 0;
    const atk_element_penetration = parseFloat(document.getElementById('atk_element_penetration').value) || 0;
    const atk_crit = parseFloat(document.getElementById('atk_crit').value) || 0;
    const atk_crit_dmg_pct = (parseFloat(document.getElementById('atk_crit_dmg_pct').value) || 150) / 100;
    const atk_hit = parseFloat(document.getElementById('atk_hit').value) || 0;
    const atk_boss_slayer = parseFloat(document.getElementById('atk_boss_slayer').value) || 0;
    const atk_shield_break = parseFloat(document.getElementById('atk_shield_break').value) || 0;

    const def_armor = parseFloat(document.getElementById('def_armor').value) || 0;
    const def_elem_res = parseFloat(document.getElementById('def_elem_res').value) || 0;
    const def_crit_res = parseFloat(document.getElementById('def_crit_res').value) || 0;
    const def_block = parseFloat(document.getElementById('def_block').value) || 0;
    const def_boss_res = parseFloat(document.getElementById('def_boss_res').value) || 0;
    const def_qi_shield = parseFloat(document.getElementById('def_qi_shield').value) || 0;
    const def_perfect_block_pct = (parseFloat(document.getElementById('def_perfect_block_pct').value) || 0) / 100;
    const def_dmg_reduction_pct = (parseFloat(document.getElementById('def_dmg_reduction_pct').value) || 0) / 100;

    const mul_skill_pct = (parseFloat(document.getElementById('mul_skill_pct').value) || 100) / 100;
    const mul_boss_pct = (parseFloat(document.getElementById('mul_boss_pct').value) || 0) / 100;
    const mul_enhance_pct = (parseFloat(document.getElementById('mul_enhance_pct').value) || 0) / 100;
    const mul_indep1_pct = (parseFloat(document.getElementById('mul_indep1_pct').value) || 0) / 100;
    const mul_indep2_pct = (parseFloat(document.getElementById('mul_indep2_pct').value) || 0) / 100;

    // 2. Khấu trừ Phòng ngự
    const rem_armor = Math.max(def_armor * (1 - atk_ignore_def_pct) - atk_defbreak, 0);
    const rem_elem_res = Math.max(def_elem_res - atk_element_penetration, 0);

    let rem_qi_shield = def_qi_shield - 2 * atk_shield_break;
    const qi_floor = 0.5 * (def_qi_shield - atk_shield_break);
    rem_qi_shield = Math.max(rem_qi_shield, qi_floor, 0);

    // 3. Tỷ lệ giảm thương
    const dr_phys = SYSTEM_CONSTANTS.ARMOR / (rem_armor + SYSTEM_CONSTANTS.ARMOR);
    const dr_elem = SYSTEM_CONSTANTS.ELEMENT_RES / (rem_elem_res + SYSTEM_CONSTANTS.ELEMENT_RES);

    // 4. Sát thương cơ bản
    const effective_phys_atk = Math.max(atk_skill + atk_base + atk_boss_slayer - def_boss_res - rem_qi_shield, 0);
    const phys_base_dmg = effective_phys_atk * dr_phys;
    const elem_base_dmg = atk_element * dr_elem;
    const total_base_dmg = phys_base_dmg + elem_base_dmg;

    // 5. Hệ số khuếch đại & Chặn biên độ Khắc Phái [65% - 125%]
    let suppression_factor = 1 + mul_boss_pct;
    suppression_factor = Math.min(Math.max(suppression_factor, SYSTEM_CONSTANTS.SUPPRESSION_MIN), SYSTEM_CONSTANTS.SUPPRESSION_MAX);

    const total_multiplier = mul_skill_pct *
        suppression_factor *
        (1 + mul_enhance_pct) *
        (1 + mul_indep1_pct) *
        (1 + mul_indep2_pct) *
        (1 - def_dmg_reduction_pct);

    const scaled_total_dmg = total_base_dmg * total_multiplier;

    // 6. Chí Mạng và Xác Suất Trúng Nâng Cao
    const rem_crit = Math.max(atk_crit - def_crit_res, 0);
    const crit_rate = Math.min((1.15 * rem_crit) / (rem_crit + SYSTEM_CONSTANTS.CRIT_CURVE), 1.0);

    const diff_hit = atk_hit - def_block;
    let hit_rate = 1.0;
    if (diff_hit >= 200) {
        hit_rate = 1.0;
    } else if (diff_hit >= -200) {
        hit_rate = 0.95 + (diff_hit / 1000) * 0.15;
    } else {
        const penalty = Math.abs(diff_hit + 200);
        hit_rate = Math.max(0.92 - (penalty / 1500) * 0.75, 0.10);
    }

    // 7. Các kịch bản và Sát thương kỳ vọng cuối cùng
    const dmg_normal = scaled_total_dmg;
    const dmg_crit = scaled_total_dmg * atk_crit_dmg_pct;
    const dmg_blocked = scaled_total_dmg * 0.5 * (1 - def_perfect_block_pct);

    const hit_factor = 1 + (crit_rate * (atk_crit_dmg_pct - 1));
    const block_factor = 0.5 * (1 - def_perfect_block_pct);
    const expected_dmg = scaled_total_dmg * ((hit_rate * hit_factor) + ((1 - hit_rate) * block_factor));

    // Lưu kết quả phục vụ xuất báo cáo
    lastCalculatedResult = {
        expected_dmg: Math.round(expected_dmg),
        dmg_normal: Math.round(dmg_normal),
        dmg_crit: Math.round(dmg_crit),
        dmg_blocked: Math.round(dmg_blocked),
        crit_rate: (crit_rate * 100).toFixed(2),
        hit_rate: (hit_rate * 100).toFixed(2),
        elem_share: total_base_dmg > 0 ? (elem_base_dmg / total_base_dmg * 100).toFixed(1) : 0
    };

    // 8. Cập nhật DOM
    document.getElementById('display_expected_dmg').innerText = lastCalculatedResult.expected_dmg.toLocaleString('vi-VN');
    document.getElementById('display_hit_normal').innerText = lastCalculatedResult.dmg_normal.toLocaleString('vi-VN');
    document.getElementById('display_hit_crit').innerText = lastCalculatedResult.dmg_crit.toLocaleString('vi-VN');
    document.getElementById('display_hit_blocked').innerText = lastCalculatedResult.dmg_blocked.toLocaleString('vi-VN');
    document.getElementById('display_crit_rate').innerText = lastCalculatedResult.crit_rate + '%';
    document.getElementById('display_hit_rate').innerText = lastCalculatedResult.hit_rate + '%';
    document.getElementById('display_dr_phys').innerText = ((1 - dr_phys) * 100).toFixed(1) + '%';
    document.getElementById('display_dr_elem').innerText = ((1 - dr_elem) * 100).toFixed(1) + '%';
    document.getElementById('display_elem_share').innerText = lastCalculatedResult.elem_share + '%';

    // Cập nhật chênh lệch So sánh (nếu có Baseline)
    updateComparisonDisplay(lastCalculatedResult.expected_dmg);

    // Chẩn đoán thông minh
    renderSmartDiagnostics({
        hit_rate, diff_hit, atk_hit, def_block, def_elem_res, atk_element_penetration,
        rem_elem_res, atk_element, dr_elem, total_multiplier, rem_armor, def_armor,
        crit_rate, atk_boss_slayer, def_boss_res
    });

    // Auto-save vào bộ nhớ tạm
    autoSaveCurrentInputs();
}

// ==========================================
// CHẨN ĐOÁN THÔNG MINH (SMART DIAGNOSTICS)
// ==========================================
function renderSmartDiagnostics(data) {
    const container = document.getElementById('display_diagnostics');
    let items = [];

    if (data.atk_boss_slayer < data.def_boss_res) {
        const gap = data.def_boss_res - data.atk_boss_slayer;
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-danger">LỖ HỔNG LỰC TAY</span>
                <span>Khắc Boss/Phái (${data.atk_boss_slayer}) thấp hơn Kháng đối thủ (${data.def_boss_res}). Bạn đang bị trừ trực tiếp <strong>${gap} điểm Nội/Ngoại công</strong> trước giáp.</span>
            </li>
        `);
    }

    if (data.def_elem_res > 0 && data.atk_element_penetration < data.def_elem_res) {
        const lostDmg = Math.round(data.atk_element * (1 - data.dr_elem) * data.total_multiplier);
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-danger">THỦNG XUYÊN KHÁNG</span>
                <span>Mục tiêu còn ${data.rem_elem_res} Kháng NT chưa trừ. Bạn đang mất khoảng <strong>${lostDmg.toLocaleString('vi-VN')} ST Nguyên tố</strong>. Cần bù đủ ${data.def_elem_res} Xuyên Kháng.</span>
            </li>
        `);
    } else if (data.atk_element_penetration > data.def_elem_res && data.def_elem_res > 0) {
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-warning">THỪA XUYÊN KHÁNG</span>
                <span>Xuyên Kháng NT (${data.atk_element_penetration}) vượt quá Kháng của mục tiêu (${data.def_elem_res}). Điểm thừa không giúp giảm âm kháng.</span>
            </li>
        `);
    }

    if (data.hit_rate >= 1.0 && data.diff_hit > 250) {
        const excess = Math.round(data.diff_hit - 200);
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-warning">THỪA CHÍNH XÁC</span>
                <span>Bạn đang thừa khoảng <strong>${excess} điểm Chính xác</strong> (đã đạt 100% trúng). Hãy tẩy bớt sang Chí Mạng hoặc Tấn Công để tối ưu DPS.</span>
            </li>
        `);
    } else if (data.hit_rate < 0.98) {
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-danger">THIẾU CHÍNH XÁC</span>
                <span>Tỷ lệ trúng chỉ đạt ${(data.hit_rate * 100).toFixed(1)}%. Đòn bị Đỡ đòn sẽ bị chia đôi sát thương và không thể nổ Crit.</span>
            </li>
        `);
    }

    if (data.rem_armor > 2860) {
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-warning">CHƯA QUA NGƯỠNG PHÁ PHÒNG</span>
                <span>Giáp địch còn lại ${Math.round(data.rem_armor)} (giảm hơn 50% ST vật lý). Nếu theo nhánh Phá Phòng, cần đẩy Phá phòng vượt mốc <strong>${Math.round(data.def_armor - 2860)}</strong> để bắt đầu có lãi.</span>
            </li>
        `);
    }

    if (data.crit_rate >= 0.65 && data.crit_rate <= 0.76) {
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-success">TỶ LỆ CRIT LÝ TƯỞNG</span>
                <span>Crit Rate đạt ${(data.crit_rate * 100).toFixed(1)}% (vùng vàng 65% - 75%). Đạt điểm cân bằng tối ưu, không bị hao phí vào đường cong 938.</span>
            </li>
        `);
    } else if (data.crit_rate < 0.55) {
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-warning">CHÍ MẠNG THẤP</span>
                <span>Tỷ lệ bạo kích chỉ đạt ${(data.crit_rate * 100).toFixed(1)}%. Hãy ưu tiên tăng thêm Chí Mạng để xoay chiêu ổn định.</span>
            </li>
        `);
    }

    container.innerHTML = `<ul class="advisor-list">${items.join('')}</ul>`;
}

// ==========================================
// TÍNH NĂNG TIỆN ÍCH: SO SÁNH BUILD A vs B
// ==========================================
function setBaselineForCompare() {
    if (!lastCalculatedResult) return;
    baselineDamage = lastCalculatedResult.expected_dmg;
    document.getElementById('compare_status_text').innerHTML = `Đang ghim mốc chuẩn: <strong>${baselineDamage.toLocaleString('vi-VN')} ST</strong>. Hãy thay đổi chỉ số trang bị bên trên để xem biến động!`;
    document.getElementById('btn_clear_baseline').style.display = 'inline-block';
    updateComparisonDisplay(baselineDamage);
    showToast('Đã ghim mốc chuẩn A thành công!');
}

function clearBaseline() {
    baselineDamage = null;
    document.getElementById('compare_status_text').innerText = 'Chưa ghim mốc so sánh. Bạn có thể ghim cấu hình hiện tại làm mốc chuẩn (A) để đối chiếu khi đổi đồ (B).';
    document.getElementById('btn_clear_baseline').style.display = 'none';
    document.getElementById('display_diff_dmg').style.display = 'none';
    showToast('Đã hủy ghim so sánh.');
}

function updateComparisonDisplay(currentDmg) {
    const diffEl = document.getElementById('display_diff_dmg');
    if (baselineDamage === null) {
        diffEl.style.display = 'none';
        return;
    }

    const diff = currentDmg - baselineDamage;
    const pct = baselineDamage > 0 ? ((diff / baselineDamage) * 100).toFixed(2) : 0;
    diffEl.style.display = 'inline-block';

    if (diff > 0) {
        diffEl.className = 'diff-badge diff-positive';
        diffEl.innerText = `▲ +${diff.toLocaleString('vi-VN')} (+${pct}%) SO VỚI BUILD CŨ`;
    } else if (diff < 0) {
        diffEl.className = 'diff-badge diff-negative';
        diffEl.innerText = `▼ ${diff.toLocaleString('vi-VN')} (${pct}%) SO VỚI BUILD CŨ`;
    } else {
        diffEl.className = 'diff-badge';
        diffEl.innerText = `Không đổi (0%)`;
    }
}

// ==========================================
// TÍNH NĂNG TIỆN ÍCH: QUẢN LÝ HỒ SƠ (PROFILES)
// ==========================================
function getFormData() {
    let data = {};
    FORM_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = parseFloat(el.value) || 0;
    });
    return data;
}

function setFormData(data) {
    if (!data) return;
    FORM_FIELDS.forEach(id => {
        if (data[id] !== undefined) {
            const el = document.getElementById(id);
            if (el) el.value = data[id];
        }
    });
    runEngine();
}

function getStoredProfiles() {
    try {
        return JSON.parse(localStorage.getItem('NTH_SAVED_PROFILES')) || {};
    } catch (e) {
        return {};
    }
}

function updateProfileDropdown(selectedName = '') {
    const profiles = getStoredProfiles();
    const select = document.getElementById('profile_select');
    select.innerHTML = '<option value="">-- Chọn hồ sơ đã lưu --</option>';

    for (let name in profiles) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        if (name === selectedName) opt.selected = true;
        select.appendChild(opt);
    }
}

function promptSaveProfile() {
    const name = prompt('Nhập tên hồ sơ cần lưu (VD: PvE Vĩnh Dạ 1.3, PvP Semi):');
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    const profiles = getStoredProfiles();
    profiles[trimmed] = getFormData();
    localStorage.setItem('NTH_SAVED_PROFILES', JSON.stringify(profiles));
    updateProfileDropdown(trimmed);
    showToast(`Đã lưu hồ sơ "${trimmed}"!`);
}

function onSelectProfile(name) {
    if (!name) return;
    const profiles = getStoredProfiles();
    if (profiles[name]) {
        setFormData(profiles[name]);
        showToast(`Đã nạp hồ sơ "${name}"!`);
    }
}

function deleteCurrentProfile() {
    const select = document.getElementById('profile_select');
    const name = select.value;
    if (!name) {
        alert('Vui lòng chọn một hồ sơ trong danh sách để xóa!');
        return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ "${name}" không?`)) {
        const profiles = getStoredProfiles();
        delete profiles[name];
        localStorage.setItem('NTH_SAVED_PROFILES', JSON.stringify(profiles));
        updateProfileDropdown();
        showToast(`Đã xóa hồ sơ "${name}"!`);
    }
}

function autoSaveCurrentInputs() {
    localStorage.setItem('NTH_LAST_SESSION', JSON.stringify(getFormData()));
}

function resetToDefaults() {
    if (confirm('Khôi phục toàn bộ bảng tính về số liệu ban đầu?')) {
        loadPreset('target_131_heroic');
        document.getElementById('atk_base').value = 6008;
        document.getElementById('atk_defbreak').value = 2045;
        document.getElementById('atk_element').value = 2418;
        document.getElementById('atk_crit').value = 2034;
        document.getElementById('atk_hit').value = 1235;
        document.getElementById('atk_boss_slayer').value = 3000;
        document.getElementById('atk_element_penetration').value = 0;
        runEngine();
        showToast('Đã đặt lại dữ liệu mặc định.');
    }
}

// ==========================================
// TÍNH NĂNG TIỆN ÍCH: CHIA SẺ LINK & BACKUP
// ==========================================
function shareBuildUrl() {
    const data = getFormData();
    const jsonStr = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const shareUrl = `${window.location.origin}${window.location.pathname}#build=${encoded}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('🔗 Đã sao chép link chia sẻ vào bộ nhớ đệm!');
    }).catch(() => {
        prompt('Copy link chia sẻ dưới đây:', shareUrl);
    });
}

function checkUrlHashBuild() {
    if (window.location.hash.startsWith('#build=')) {
        try {
            const raw = window.location.hash.replace('#build=', '');
            const decoded = decodeURIComponent(atob(raw));
            const data = JSON.parse(decoded);
            setFormData(data);
            showToast('⚡ Đã nạp thành công bộ chỉ số từ đường link chia sẻ!');
            return true;
        } catch (e) {
            console.error('Lỗi khi nạp build từ hash URL:', e);
        }
    }
    return false;
}

function exportProfilesJson() {
    const exportData = {
        app: "NTH_Damage_Engine",
        version: "1.3.2",
        exported_at: new Date().toISOString(),
        current_build: getFormData(),
        saved_profiles: getStoredProfiles()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NTH_Builds_Backup_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file backup JSON thành công!');
}

function importProfilesJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.saved_profiles) {
                const current = getStoredProfiles();
                const merged = Object.assign({}, current, imported.saved_profiles);
                localStorage.setItem('NTH_SAVED_PROFILES', JSON.stringify(merged));
                updateProfileDropdown();
            }
            if (imported.current_build) {
                setFormData(imported.current_build);
            }
            showToast('Đã nạp file backup JSON thành công!');
        } catch (err) {
            alert('File JSON không hợp lệ hoặc bị lỗi định dạng!');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function copyReportText() {
    if (!lastCalculatedResult) return;
    const report = 
`📊 [BÁO CÁO SÁT THƯƠNG NGHỊCH THỦY HÀN]
• ST Kỳ Vọng: ${lastCalculatedResult.expected_dmg.toLocaleString('vi-VN')}
• Đòn Thường: ${lastCalculatedResult.dmg_normal.toLocaleString('vi-VN')}
• Nổ Bạo Kích: ${lastCalculatedResult.dmg_crit.toLocaleString('vi-VN')}
• Bị Đỡ Đòn: ${lastCalculatedResult.dmg_blocked.toLocaleString('vi-VN')}
• Tỷ Lệ Bạo Kích: ${lastCalculatedResult.crit_rate}%
• Tỷ Lệ Đánh Trúng: ${lastCalculatedResult.hit_rate}%
• Tỷ Trọng Nguyên Tố: ${lastCalculatedResult.elem_share}%`;

    navigator.clipboard.writeText(report).then(() => {
        showToast('📋 Đã copy bản tóm tắt vào bộ nhớ đệm!');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast_msg');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function loadPreset(key) {
    const data = PRESETS[key];
    if (!data) return;

    for (let id in data) {
        const el = document.getElementById(id);
        if (el) el.value = data[id];
    }

    document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    runEngine();
}

// Khởi chạy khi nạp trang
window.onload = function() {
    updateProfileDropdown();

    // 1. Kiểm tra nếu mở từ link chia sẻ
    const loadedFromUrl = checkUrlHashBuild();

    // 2. Nếu không có link chia sẻ, khôi phục session gần nhất
    if (!loadedFromUrl) {
        try {
            const lastSession = JSON.parse(localStorage.getItem('NTH_LAST_SESSION'));
            if (lastSession) setFormData(lastSession);
            else runEngine();
        } catch (e) {
            runEngine();
        }
    }
};
