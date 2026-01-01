export class safeObject extends Object {
    _safe_valueWithKey(key, defaultValue = null) {
        if (!Object.hasOwn(this, key)) {
            return defaultValue ?? null;
        }

        const value = this[key];

        if (value === null || value === undefined) {
            return defaultValue ?? null;
        }

        return value;
    }

    safe_stringWithKey(key, defaultValue = null) {
        let value = this._safe_valueWithKey(key, defaultValue);
        if (typeof value === "string") {
            return value;
        }
        if (typeof value === "number") {
            return value.toString();
        }
        return typeof defaultValue === "string" ? defaultValue ?? null : null;
    }

    safe_numberWithKey(key, defaultValue = null) {
        let value = this._safe_valueWithKey(key, defaultValue);
        if (typeof value === "number") {
            return value;
        }
        if (typeof value === "string") {
            let valueNumber = Number(value);
            if (isNaN(valueNumber)) {
                return defaultValue ?? null;
            }
            return valueNumber;
        }
        if (typeof value === "boolean") {
            return value ? 1 : 0;
        }
        return typeof defaultValue === "number" ? defaultValue ?? null : null;
    }

    safe_integerWithKey(key, defaultValue = null) {
        const value = this.safe_numberWithKey(key);
        if (typeof value === "number") {
            if (Number.isInteger(value)) {
                return value;
            } else {
                return Math.floor(value);
            }
        }
        if (Number.isInteger(defaultValue)) {
            return defaultValue;
        }
        return null;
    }

    safe_boolWithKey(key, defaultValue = null) {
        const value = this._safe_valueWithKey(key, defaultValue);
        if (typeof value === "boolean") {
            return value;
        }
        if (typeof value === "number") {
            return value >= 0;
        }
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();

            if (normalized === "true" || normalized === "1" || normalized === "yes") {
                return true;
            }
            if (normalized === "false" || normalized === "0" || normalized === "no") {
                return false;
            }
        }
        return typeof defaultValue === "boolean" ? defaultValue ?? null : null;
    }

    safe_arrayWithKey(key, defaultValue = null) {
        const value = this._safe_valueWithKey(key, defaultValue);
        if (Array.isArray(value)) {
            return value;
        }
        return Array.isArray(defaultValue) ? defaultValue ?? null : null;
    }

    safe_dictWithKey(key, defaultValue = null) {
        const value = this._safe_valueWithKey(key, defaultValue);
        if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        ) {
            return value;
        }
        return typeof value === "object" && value !== null && !Array.isArray(value)
            ? defaultValue ?? null
            : null;
    }
}
