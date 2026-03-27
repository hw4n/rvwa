import type { AttributeValue, MetadataFieldDefinition, MetadataFieldType } from "@/lib/domain";

export const metadataFieldTypeOptions: Array<{
  value: MetadataFieldType;
  label: string;
}> = [
  { value: "text", label: "text" },
  { value: "number", label: "number" },
  { value: "boolean", label: "boolean" },
  { value: "list", label: "list" },
];

const METADATA_KEY_INPUT_PATTERN = /^[A-Za-z0-9 _-]+$/;

export function normalizeMetadataKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidMetadataKeyInput(value: string) {
  const trimmed = value.trim();
  return !trimmed || METADATA_KEY_INPUT_PATTERN.test(trimmed);
}

export function inferMetadataFieldType(value: AttributeValue): MetadataFieldType {
  if (Array.isArray(value)) {
    return "list";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return "number";
  }

  return "text";
}

export function formatMetadataValueForInput(
  value: AttributeValue | undefined,
  type: MetadataFieldType
) {
  if (type === "boolean") {
    return Boolean(value);
  }

  if (type === "list") {
    return Array.isArray(value) ? value.join(", ") : "";
  }

  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

export function parseMetadataValue(
  type: MetadataFieldType,
  rawValue: string | boolean
): AttributeValue | undefined {
  if (type === "boolean") {
    return Boolean(rawValue);
  }

  const text = String(rawValue).trim();
  if (!text) {
    return undefined;
  }

  if (type === "number") {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (type === "list") {
    const values = text
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    return values.length ? values : undefined;
  }

  return text;
}

export function sortAttributeEntries(
  attributes: Record<string, AttributeValue>,
  fieldDefinitions: MetadataFieldDefinition[]
) {
  const fieldMap = new Map(fieldDefinitions.map((field) => [field.key, field.label]));
  const definedEntries = fieldDefinitions
    .filter((field) => field.key in attributes)
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: attributes[field.key],
    }));
  const customEntries = Object.entries(attributes)
    .filter(([key]) => !fieldMap.has(key))
    .map(([key, value]) => ({
      key,
      label: key,
      value,
    }));

  return [...definedEntries, ...customEntries];
}
