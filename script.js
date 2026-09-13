/**
 * NGHỊCH THỦY HÀN MOBILE - HYBRID DAMAGE & TANK ENGINE 1.3.3
 * Tích hợp: Boss 1.3.3 Heroic, Thẩm Định Tank EHP, Hiệu Chỉnh Sai Lệch DPS Cọc, Min/Max Attack, Bão Hòa Crit 938
 */

const SYSTEM_CONSTANTS = {
    ARMOR: 2860,            // Hộ giáp: 2860 / (Giáp + 2860)
    ELEMENT_RES: 530,       // Kháng nguyên tố: 530 / (Kháng + 530)
    CRIT_CURVE: 938,        // Đường cong chí mạng: (1.15 * X) / (X + 938)
    SUPPRESSION_MIN: 0.65,  // Chặn đáy khắc phái (65%)
    SUPPRESSION_MAX: 1.25   // Chặn trần khắc phái (125%)
};

const FORM_FIELDS = [
    'atk_min', 'atk_max', 'atk_base', 'atk_skill', 'atk_defbreak', 'atk_ignore_def_pct',
    'atk_element', 'atk_element_penetration', 'atk_crit', 'atk_crit_dmg_pct', 'atk_hit',
    'atk_boss_slayer', 'atk_shield_break', 'def_armor', 'def_elem_res', 'def_crit_res',
    'def_block', 'def_boss_res', 'def_qi_shield', 'def_hp', 'def_perfect_block_pct',
    'def_crit_reduction_pct', 'def_dmg_reduction_pct', 'mul_skill_pct', 'mul_boss_pct',
    'mul_enhance_pct', 'mul_single_pct', 'mul_aoe_pct', 'mul_burst_pct', 'mul_dot_pct',
    'mul_indep1_pct'
];

const PRESETS = {
    target_131_heroic: {
        def_armor: 5550, def_elem_res: 76, def_crit_res: 1098, def_block: 900,
        def_boss_res: 3000, def_qi_shield: 586, def_hp: 128083, def_perfect_block_pct: 0,
        def_crit_reduction_pct: 0, def_dmg_reduction_pct: 0
    },
    target_132_heroic: {
        def_armor: 5550, def_elem_res: 80, def_crit_res: 1200, def_block: 1050,
        def_boss_res: 3300, def_qi_shield: 600, def_hp: 145000, def_perfect_block_pct: 0,
        def_crit_reduction_pct: 0, def_dmg_reduction_pct: 0
    },
    target_133_heroic: {
        def_armor: 5550, def_elem_res: 80, def_crit_res: 1250, def_block: 1100,
        def_boss_res: 3500, def_qi_shield: 620, def_hp: 160000, def_perfect_block_pct: 0,
        def_crit_reduction_pct: 0, def_dmg_reduction_pct: 0
    },
    build_tank_thiety: {
        def_armor: 6200, def_elem_res: 800, def_crit_res: 1850, def_block: 1150,
        def_boss_res: 3500, def_qi_shield: 4500, def_hp: 135000, def_perfect_block_pct: 10,
        def_crit_reduction_pct: 20, def_dmg_reduction_pct: 18
    },
    build_tank_tovan: {
        def_armor: 5860, def_elem_res: 720, def_crit_res: 1750, def_block: 950,
        def_boss_res: 2800, def_qi_shield: 3500, def_hp: 115000, def_perfect_block_pct: 5,
        def_crit_reduction_pct: 15, def_dmg_reduction_pct: 12
    },
    target_pvp_tank_4piece: {
        def_armor: 5200, def_elem_res: 650, def_crit_res: 1600, def_block: 900,
        def_boss_res: 2800, def_qi_shield: 3000, def_hp: 110000, def_perfect_block_pct: 5,
        def_crit_reduction_pct: 10, def_dmg_reduction_pct: 10
    },
    target_pvp_tank_6piece: {
        def_armor: 5860, def_elem_res: 750, def_crit_res: 1800, def_block: 950,
        def_boss_res: 4200, def_qi_shield: 3800, def_hp: 125000, def_perfect_block_pct: 10,
        def_crit_reduction_pct: 15, def_dmg_reduction_pct: 15
    }
};

let baselineDamage = null;
let lastCalculatedResult = null;

/**
 * Điều khiển bật/tắt module hiệu chỉnh sai lệch
 */
function onToggleCalibration() {
    const isEnabled = document.getElementById('calib_enable').checked;
    document.getElementById('calib_inputs').style.display = isEnabled ? 'block' : 'none';
    runEngine();
}

function onActualDpsInput() {
    if (!lastCalculatedResult) return;
    const actualDps = parseFloat(document.getElementById('calib_actual_dps').value);
    if (!isNaN(actualDps)) {
        const rawKdps = lastCalculatedResult.raw_expected_dmg / 1000;
        const offset = Math.round(actualDps - rawKdps);
        document.getElementById('calib_offset_kdps').value = offset;
    }
    runEngine();
}

function onOffsetInput() {
    if (!lastCalculatedResult) return;
    const offset = parseFloat(document.getElementById('calib_offset_kdps').value) || 0;
    const rawKdps = lastCalculatedResult.raw_expected_dmg / 1000;
    document.getElementById('calib_actual_dps').value = Math.round(rawKdps + offset);
    runEngine();
}

function onSkillModeChange(mode) {
    const manualGroup = document.getElementById('manual_tags_group');
    if (mode === 'custom') {
        manualGroup.style.display = 'flex';
    } else {
        manualGroup.style.display = 'none';
    }
    runEngine();
}

function calculateEffectiveSkillEnhance() {
    const mode = document.getElementById('skill_preset_mode').value;
    const enhance_base = parseFloat(document.getElementById('mul_enhance_pct').value) || 0;
    const single = parseFloat(document.getElementById('mul_single_pct').value) || 0;
    const aoe = parseFloat(document.getElementById('mul_aoe_pct').value) || 0;
    const burst = parseFloat(document.getElementById('mul_burst_pct').value) || 0;
    const dot = parseFloat(document.getElementById('mul_dot_pct').value) || 0;

    let totalBonus = enhance_base;

    switch (mode) {
        case 'single_burst':
            totalBonus += single + burst;
            break;
        case 'single_dot':
            totalBonus += single + dot;
            break;
        case 'aoe_burst':
            totalBonus += aoe + burst;
            break;
        case 'aoe_dot':
            totalBonus += aoe + dot;
            break;
        case 'rotation':
            totalBonus += (single * 0.60 + aoe * 0.40) + (burst * 0.50 + dot * 0.50);
            break;
        case 'custom':
            const isSingle = document.getElementById('tag_target_single').checked;
            const isBurst = document.getElementById('tag_type_burst').checked;
            totalBonus += (isSingle ? single : aoe) + (isBurst ? burst : dot);
            break;
    }

    return totalBonus;
}

function onAtkMinMaxChange() {
    const min = parseFloat(document.getElementById('atk_min').value) || 0;
    const max = parseFloat(document.getElementById('atk_max').value) || min;
    const avg = Math.round((min + max) / 2);
    document.getElementById('atk_base').value = avg;
    runEngine();
}

function runEngine() {
    const atk_min = parseFloat(document.getElementById('atk_min').value) || 0;
    const atk_max = parseFloat(document.getElementById('atk_max').value) || atk_min;
    const atk_base = (atk_min + atk_max) / 2;
    document.getElementById('atk_base').value = Math.round(atk_base);

    const atk_skill = parseFloat(document.getElementById('atk_skill').value) || 0;
    const atk_defbreak = parseFloat(document.getElementById('atk_defbreak').value) || 0;
    const atk_ignore_def_pct = (parseFloat(document.getElementById('atk_ignore_def_pct').value) || 0) / 100;
    const atk_element = parseFloat(document.getElementById('atk_element').value) || 0;
    const atk_element_penetration = parseFloat(document.getElementById('atk_element_penetration').value) || 0;
    const atk_crit = parseFloat(document.getElementById('atk_crit').value) || 0;
    
    const raw_crit_dmg = parseFloat(document.getElementById('atk_crit_dmg_pct').value) || 150;
    const def_crit_red = parseFloat(document.getElementById('def_crit_reduction_pct').value) || 0;
    const effective_crit_dmg_pct = Math.max(raw_crit_dmg - def_crit_red, 150) / 100;

    const atk_hit = parseFloat(document.getElementById('atk_hit').value) || 0;
    const atk_boss_slayer = parseFloat(document.getElementById('atk_boss_slayer').value) || 0;
    const atk_shield_break = parseFloat(document.getElementById('atk_shield_break').value) || 0;

    const def_armor = parseFloat(document.getElementById('def_armor').value) || 0;
    const def_elem_res = parseFloat(document.getElementById('def_elem_res').value) || 0;
    const def_crit_res = parseFloat(document.getElementById('def_crit_res').value) || 0;
    const def_block = parseFloat(document.getElementById('def_block').value) || 0;
    const def_boss_res = parseFloat(document.getElementById('def_boss_res').value) || 0;
    const def_qi_shield = parseFloat(document.getElementById('def_qi_shield').value) || 0;
    const def_hp = parseFloat(document.getElementById('def_hp').value) || 100000;
    const def_perfect_block_pct = (parseFloat(document.getElementById('def_perfect_block_pct').value) || 0) / 100;
    const def_dmg_reduction_pct = (parseFloat(document.getElementById('def_dmg_reduction_pct').value) || 0) / 100;

    const mul_skill_pct = (parseFloat(document.getElementById('mul_skill_pct').value) || 100) / 100;
    const mul_boss_pct = (parseFloat(document.getElementById('mul_boss_pct').value) || 0) / 100;
    const mul_indep1_pct = (parseFloat(document.getElementById('mul_indep1_pct').value) || 0) / 100;

    const effective_enhance_pct = calculateEffectiveSkillEnhance() / 100;

    // 1. Khấu trừ Phòng ngự
    const rem_armor = Math.max(def_armor * (1 - atk_ignore_def_pct) - atk_defbreak, 0);
    const rem_elem_res = Math.max(def_elem_res - atk_element_penetration, 0);

    let rem_qi_shield = def_qi_shield - 2 * atk_shield_break;
    const qi_floor = 0.5 * (def_qi_shield - atk_shield_break);
    rem_qi_shield = Math.max(rem_qi_shield, qi_floor, 0);

    // 2. Tỷ lệ giảm thương
    const dr_phys = SYSTEM_CONSTANTS.ARMOR / (rem_armor + SYSTEM_CONSTANTS.ARMOR);
    const dr_elem = SYSTEM_CONSTANTS.ELEMENT_RES / (rem_elem_res + SYSTEM_CONSTANTS.ELEMENT_RES);

    // 3. Sát thương cơ bản 3 luồng
    const calcBaseDamage = (atk_val) => {
        const eff_atk = Math.max(atk_skill + atk_val + atk_boss_slayer - def_boss_res - rem_qi_shield, 0);
        const p_dmg = eff_atk * dr_phys;
        const e_dmg = atk_element * dr_elem;
        return { total: p_dmg + e_dmg, p_dmg, e_dmg };
    };

    const base_min = calcBaseDamage(atk_min);
    const base_max = calcBaseDamage(atk_max);
    const base_avg = calcBaseDamage(atk_base);

    // 4. Hệ số nhân khuếch đại
    let suppression_factor = 1 + mul_boss_pct;
    suppression_factor = Math.min(Math.max(suppression_factor, SYSTEM_CONSTANTS.SUPPRESSION_MIN), SYSTEM_CONSTANTS.SUPPRESSION_MAX);

    const total_multiplier = mul_skill_pct *
        suppression_factor *
        (1 + effective_enhance_pct) *
        (1 + mul_indep1_pct) *
        (1 - def_dmg_reduction_pct);

    const scaled_min = base_min.total * total_multiplier;
    const scaled_max = base_max.total * total_multiplier;
    const scaled_avg = base_avg.total * total_multiplier;

    // 5. Tỷ lệ bạo kích và tỷ lệ trúng
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

    // 6. Đầu ra kết quả lý thuyết
    const hit_factor = 1 + (crit_rate * (effective_crit_dmg_pct - 1));
    const block_factor = 0.5 * (1 - def_perfect_block_pct);
    const raw_expected_dmg = scaled_avg * ((hit_rate * hit_factor) + ((1 - hit_rate) * block_factor));

    // 7. Xử lý Hiệu Chỉnh Sai Lệch (Calibration Offset)
    let final_expected_dmg = raw_expected_dmg;
    const isCalibEnabled = document.getElementById('calib_enable').checked;
    let offsetKdps = 0;

    if (isCalibEnabled) {
        offsetKdps = parseFloat(document.getElementById('calib_offset_kdps').value) || 0;
        final_expected_dmg = Math.max(raw_expected_dmg + (offsetKdps * 1000), 0);
    }

    // 8. Tính Toán Chỉ Số Thủ & Tank (EHP & Khắc Chế)
    const ehp_phys = Math.round(def_hp / Math.max(dr_phys * (1 - def_dmg_reduction_pct), 0.05));
    const ehp_elem = Math.round(def_hp / Math.max(dr_elem * (1 - def_dmg_reduction_pct), 0.05));
    const crit_suppression_pct = Math.max(0, 100 - (crit_rate * 100)).toFixed(1);

    let tankRating = "Máu Giấy";
    if (rem_armor >= 2860 && rem_elem_res >= 530 && def_crit_res >= 1600) {
        tankRating = "Bất Tử (God Tank)";
    } else if (rem_armor >= 2000 || def_hp >= 120000) {
        tankRating = "Bán Nhục (Trâu)";
    }

    lastCalculatedResult = {
        raw_expected_dmg: Math.round(raw_expected_dmg),
        expected_dmg: Math.round(final_expected_dmg),
        hit_min: Math.round(scaled_min),
        hit_max: Math.round(scaled_max),
        crit_min: Math.round(scaled_min * effective_crit_dmg_pct),
        crit_max: Math.round(scaled_max * effective_crit_dmg_pct),
        dmg_blocked: Math.round(scaled_avg * block_factor),
        crit_rate: (crit_rate * 100).toFixed(2),
        hit_rate: (hit_rate * 100).toFixed(2),
        elem_share: base_avg.total > 0 ? (base_avg.e_dmg / base_avg.total * 100).toFixed(1) : 0,
        ehp_phys,
        ehp_elem,
        crit_suppression_pct,
        tankRating
    };

    // 9. Cập nhật giao diện
    document.getElementById('display_expected_dmg').innerText = lastCalculatedResult.expected_dmg.toLocaleString('vi-VN');
    document.getElementById('display_hit_minmax').innerText = `${lastCalculatedResult.hit_min.toLocaleString('vi-VN')} - ${lastCalculatedResult.hit_max.toLocaleString('vi-VN')}`;
    document.getElementById('display_crit_minmax').innerText = `${lastCalculatedResult.crit_min.toLocaleString('vi-VN')} - ${lastCalculatedResult.crit_max.toLocaleString('vi-VN')}`;
    document.getElementById('display_hit_blocked').innerText = lastCalculatedResult.dmg_blocked.toLocaleString('vi-VN');
    
    document.getElementById('display_crit_rate').innerText = lastCalculatedResult.crit_rate + '%';
    document.getElementById('display_hit_rate').innerText = lastCalculatedResult.hit_rate + '%';
    document.getElementById('display_dr_phys').innerText = ((1 - dr_phys) * 100).toFixed(1) + '%';
    document.getElementById('display_dr_elem').innerText = ((1 - dr_elem) * 100).toFixed(1) + '%';
    document.getElementById('display_elem_share').innerText = lastCalculatedResult.elem_share + '%';

    // Cập nhật chỉ số Tank
    document.getElementById('display_ehp_phys').innerText = lastCalculatedResult.ehp_phys.toLocaleString('vi-VN');
    document.getElementById('display_ehp_elem').innerText = lastCalculatedResult.ehp_elem.toLocaleString('vi-VN');
    document.getElementById('display_crit_suppressed').innerText = lastCalculatedResult.crit_suppression_pct + '%';
    document.getElementById('display_tank_rating').innerText = lastCalculatedResult.tankRating;

    // Cập nhật Badge Hiệu Chỉnh Sai Lệch
    const calibBadge = document.getElementById('display_calib_badge');
    if (isCalibEnabled && offsetKdps !== 0) {
        calibBadge.style.display = 'inline-block';
        calibBadge.innerText = `ĐÃ BÙ: ${offsetKdps > 0 ? '+' : ''}${offsetKdps} kDPS`;
    } else {
        calibBadge.style.display = 'none';
    }

    updateComparisonDisplay(lastCalculatedResult.expected_dmg);

    renderSmartDiagnostics({
        hit_rate, diff_hit, atk_hit, def_block, def_elem_res, atk_element_penetration,
        rem_elem_res, atk_element, dr_elem, total_multiplier, rem_armor, def_armor,
        crit_rate, atk_boss_slayer, def_boss_res, ehp_phys, tankRating
    });

    autoSaveCurrentInputs();
}

function renderSmartDiagnostics(data) {
    const container = document.getElementById('display_diagnostics');
    let items = [];

    // Chẩn đoán Build Thủ & EHP
    items.push(`
        <li class="advisor-item">
            <span class="tag-badge tag-tank">THẨM ĐỊNH THỦ (${data.tankRating.toUpperCase()})</span>
            <span>Máu hiệu dụng: <strong>${data.ehp_phys.toLocaleString('vi-VN')} EHP Vật Lý</strong>. Địch cần gây lượng dame tương đương mốc này mới có thể hạ gục bạn.</span>
        </li>
    `);

    // Chẩn đoán Khắc Boss
    if (data.atk_boss_slayer < data.def_boss_res) {
        const gap = data.def_boss_res - data.atk_boss_slayer;
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-danger">LỖ HỔNG KHẮC BOSS</span>
                <span>Khắc quái (${data.atk_boss_slayer}) thấp hơn Kháng của mục tiêu (${data.def_boss_res}). Bạn đang bị trừ trực tiếp <strong>${gap} điểm Nội/Ngoại công</strong> trước khi tính giáp!</span>
            </li>
        `);
    }

    // Chẩn đoán Xuyên Kháng Nguyên Tố
    if (data.def_elem_res > 0 && data.atk_element_penetration < data.def_elem_res) {
        const lostDmg = Math.round(data.atk_element * (1 - data.dr_elem) * data.total_multiplier);
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-danger">THỦNG XUYÊN KHÁNG NT</span>
                <span>Mục tiêu còn ${data.rem_elem_res} Kháng NT. Bạn đang thất thoát khoảng <strong>${lostDmg.toLocaleString('vi-VN')} ST Nguyên tố</strong>. Cần bù đủ ${data.def_elem_res} Xuyên Kháng NT.</span>
            </li>
        `);
    }

    // Chẩn đoán Chính Xác
    if (data.hit_rate >= 1.0 && data.diff_hit > 250) {
        const excess = Math.round(data.diff_hit - 200);
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-warning">THỪA CHÍNH XÁC</span>
                <span>Bạn đang thừa khoảng <strong>${excess} điểm Chính xác</strong> (đã đạt 100% trúng). Hãy tẩy bớt sang Chí Mạng hoặc Tấn Công.</span>
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

    // Chẩn đoán Bạo Kích
    if (data.crit_rate >= 0.65 && data.crit_rate <= 0.76) {
        items.push(`
            <li class="advisor-item">
                <span class="tag-badge tag-success">TỶ LỆ CRIT VÀNG</span>
                <span>Crit Rate đạt ${(data.crit_rate * 100).toFixed(1)}% (vùng tối ưu 65% - 75%). Đạt điểm cân bằng hoàn hảo theo đường cong 938.</span>
            </li>
        `);
    }

    container.innerHTML = `<ul class="advisor-list">${items.join('')}</ul>`;
}

// CÁC HÀM TIỆN ÍCH PROFILE & SO SÁNH
function setBaselineForCompare() {
    if (!lastCalculatedResult) return;
    baselineDamage = lastCalculatedResult.expected_dmg;
    document.getElementById('compare_status_text').innerHTML = `Đang ghim mốc chuẩn: <strong>${baselineDamage.toLocaleString('vi-VN')} ST</strong>. Hãy đổi đồ để xem chênh lệch!`;
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

function getFormData() {
    let data = {};
    FORM_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = parseFloat(el.value) || 0;
    });
    data['skill_preset_mode'] = document.getElementById('skill_preset_mode').value;
    data['calib_enable'] = document.getElementById('calib_enable').checked;
    data['calib_offset_kdps'] = parseFloat(document.getElementById('calib_offset_kdps').value) || 0;
    data['calib_actual_dps'] = parseFloat(document.getElementById('calib_actual_dps').value) || 0;
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
    if (data['skill_preset_mode']) {
        document.getElementById('skill_preset_mode').value = data['skill_preset_mode'];
        onSkillModeChange(data['skill_preset_mode']);
    }
    if (data['calib_enable'] !== undefined) {
        document.getElementById('calib_enable').checked = data['calib_enable'];
        document.getElementById('calib_inputs').style.display = data['calib_enable'] ? 'block' : 'none';
        document.getElementById('calib_offset_kdps').value = data['calib_offset_kdps'] || 0;
        document.getElementById('calib_actual_dps').value = data['calib_actual_dps'] || 0;
    }
    onAtkMinMaxChange();
}

function getStoredProfiles() {
    try {
        return JSON.parse(localStorage.getItem('NTH_PROFILES_V4')) || {};
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
    const name = prompt('Nhập tên hồ sơ (VD: Tố Vấn PvE 1.3.3, Thiết Y Tank 1.3):');
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    const profiles = getStoredProfiles();
    profiles[trimmed] = getFormData();
    localStorage.setItem('NTH_PROFILES_V4', JSON.stringify(profiles));
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
        alert('Vui lòng chọn một hồ sơ để xóa!');
        return;
    }

    if (confirm(`Bạn có chắc muốn xóa hồ sơ "${name}"?`)) {
        const profiles = getStoredProfiles();
        delete profiles[name];
        localStorage.setItem('NTH_PROFILES_V4', JSON.stringify(profiles));
        updateProfileDropdown();
        showToast(`Đã xóa hồ sơ "${name}"!`);
    }
}

function autoSaveCurrentInputs() {
    localStorage.setItem('NTH_SESSION_V4', JSON.stringify(getFormData()));
}

function resetToDefaults() {
    if (confirm('Khôi phục toàn bộ dữ liệu mặc định ban đầu?')) {
        loadPreset('target_131_heroic');
        document.getElementById('atk_min').value = 6000;
        document.getElementById('atk_max').value = 6800;
        document.getElementById('atk_defbreak').value = 1634;
        document.getElementById('atk_element').value = 3096;
        document.getElementById('atk_crit').value = 2073;
        document.getElementById('atk_crit_dmg_pct').value = 192.4;
        document.getElementById('atk_hit').value = 1425;
        document.getElementById('atk_boss_slayer').value = 1311;
        document.getElementById('atk_shield_break').value = 744;
        document.getElementById('mul_boss_pct').value = 23.2;
        document.getElementById('mul_enhance_pct').value = 3.0;
        document.getElementById('mul_single_pct').value = 12.0;
        document.getElementById('mul_aoe_pct').value = 0.0;
        document.getElementById('mul_burst_pct').value = 0.0;
        document.getElementById('mul_dot_pct').value = 0.0;
        document.getElementById('calib_enable').checked = false;
        document.getElementById('calib_inputs').style.display = 'none';
        document.getElementById('calib_offset_kdps').value = 0;
        document.getElementById('calib_actual_dps').value = 0;
        document.getElementById('skill_preset_mode').value = 'single_burst';
        onSkillModeChange('single_burst');
        onAtkMinMaxChange();
        showToast('Đã khôi phục dữ liệu ban đầu.');
    }
}

function shareBuildUrl() {
    const data = getFormData();
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const shareUrl = `${window.location.origin}${window.location.pathname}#build=${encoded}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('🔗 Đã sao chép link chia sẻ vào bộ nhớ đệm!');
    }).catch(() => {
        prompt('Copy link chia sẻ:', shareUrl);
    });
}

function checkUrlHashBuild() {
    if (window.location.hash.startsWith('#build=')) {
        try {
            const raw = window.location.hash.replace('#build=', '');
            const data = JSON.parse(decodeURIComponent(atob(raw)));
            setFormData(data);
            showToast('⚡ Đã nạp thành công build từ đường link!');
            return true;
        } catch (e) {
            console.error(e);
        }
    }
    return false;
}

function exportProfilesJson() {
    const exportData = {
        app: "NTH_Damage_Engine",
        version: "1.3.3_Ultimate",
        exported_at: new Date().toISOString(),
        current_build: getFormData(),
        saved_profiles: getStoredProfiles()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NTH_Builds_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file JSON thành công!');
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
                localStorage.setItem('NTH_PROFILES_V4', JSON.stringify(merged));
                updateProfileDropdown();
            }
            if (imported.current_build) {
                setFormData(imported.current_build);
            }
            showToast('Đã nạp file JSON thành công!');
        } catch (err) {
            alert('File JSON không hợp lệ!');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function copyReportText() {
    if (!lastCalculatedResult) return;
    const mode = document.getElementById('skill_preset_mode').value;
    const isCalib = document.getElementById('calib_enable').checked;
    const report = 
`📊 [BÁO CÁO SÁT THƯƠNG & TANK NGHỊCH THỦY HÀN]
• ST Kỳ Vọng (DPS): ${lastCalculatedResult.expected_dmg.toLocaleString('vi-VN')} ${isCalib ? '(Đã Hiệu Chỉnh)' : ''}
• Đòn Trúng (Min - Max): ${lastCalculatedResult.hit_min.toLocaleString('vi-VN')} - ${lastCalculatedResult.hit_max.toLocaleString('vi-VN')}
• Nổ Bạo Kích (Min - Max): ${lastCalculatedResult.crit_min.toLocaleString('vi-VN')} - ${lastCalculatedResult.crit_max.toLocaleString('vi-VN')}
• Tỷ Lệ Bạo Kích: ${lastCalculatedResult.crit_rate}%
• Tỷ Lệ Trúng Đòn: ${lastCalculatedResult.hit_rate}%
• Tỷ Trọng Nguyên Tố: ${lastCalculatedResult.elem_share}%
• Đánh Giá Thủ: ${lastCalculatedResult.tankRating} (EHP: ${lastCalculatedResult.ehp_phys.toLocaleString('vi-VN')})`;

    navigator.clipboard.writeText(report).then(() => {
        showToast('📋 Đã copy bản tóm tắt báo cáo!');
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

window.onload = function() {
    updateProfileDropdown();
    const loadedFromUrl = checkUrlHashBuild();
    if (!loadedFromUrl) {
        try {
            const lastSession = JSON.parse(localStorage.getItem('NTH_SESSION_V4'));
            if (lastSession) setFormData(lastSession);
            else onAtkMinMaxChange();
        } catch (e) {
            onAtkMinMaxChange();
        }
    }
};
