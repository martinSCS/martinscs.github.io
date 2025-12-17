const NORMALIZE_FORMS = new Set(['NFC', 'NFD', 'NFKC', 'NFKD']);

/// 字符串拆分成单字函数
export const characterBreak = (p) => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const segments = segmenter.segment(p);
    return Array.from(segments, s => s.segment);
}

/// 字符串正则性判断
export const normalizedStringCompare = (str1, str2, form) => {
    form = form.toUpperCase();
    if (!NORMALIZE_FORMS.has(form)) {
        return str1.normalize() === str2.normalize();
    }
    return str1.normalize(form) === str2.normalize(form);
}