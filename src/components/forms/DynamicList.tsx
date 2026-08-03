import { useState } from "react";
import { Box, Button, DialogContentText } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import FieldRenderer from "./FieldRenderer";
import DynamicListItem from "./DynamicListItem";
import AppModal from "../ui/AppModal";
import type { FieldDefinition } from "../../config/fields/types";

type DynamicListFieldMapping<T extends Record<string, string>> = {
  fields: FieldDefinition[];
  fieldToKey: T;
  /** Field IDs to render side-by-side in a 2-column grid inside the dialog. */
  gridFields?: string[];
};

type DynamicListProps<T extends Record<string, string>> = {
  control: Control<Record<string, any>>;
  name: string;
  label: string;
  mapping: DynamicListFieldMapping<T>;
  renderItem: (item: Record<string, string>) => React.ReactNode;
  /** Accessible label for each item used in Edit/Remove button aria-labels.
   *  Receives the item data and returns a string, e.g. (item) => item.name. */
  getItemLabel?: (item: Record<string, string>) => string;
  /** Minimum number of items. Add button is always shown; page-level validation
   *  enforces the minimum on submit. Default: 0. */
  minItems?: number;
  /** Maximum number of items. Add button is hidden when count reaches max. Default: 10. */
  maxItems?: number;
};

export default function DynamicList<T extends Record<string, string>>({
  control,
  name,
  label,
  mapping,
  renderItem,
  getItemLabel,
  minItems: _minItems = 0,
  maxItems = 10,
}: DynamicListProps<T>) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const defaultFormValues = Object.fromEntries(
    mapping.fields.map((f) => [f.id, ""]),
  );

  const {
    control: itemControl,
    handleSubmit,
    reset,
    formState: { errors: itemErrors },
  } = useForm({ defaultValues: defaultFormValues });

  const handleAdd = () => {
    reset(defaultFormValues);
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEdit = (index: number) => {
    const item = fields[index] as unknown as Record<string, string>;
    const restored: Record<string, string> = {};
    for (const [fieldId, key] of Object.entries(mapping.fieldToKey)) {
      restored[fieldId] = item[key] ?? "";
    }
    reset(restored);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSave = (data: Record<string, string>) => {
    const item: Record<string, string> = {};
    for (const [fieldId, key] of Object.entries(mapping.fieldToKey)) {
      item[key] = data[fieldId] ?? "";
    }
    if (editingIndex !== null) {
      update(editingIndex, item);
    } else {
      append(item);
    }
    setShowForm(false);
    reset(defaultFormValues);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    reset(defaultFormValues);
    setEditingIndex(null);
  };

  const handleRemoveRequest = (index: number) => {
    setRemoveIndex(index);
  };

  const handleRemoveConfirm = () => {
    if (removeIndex !== null) {
      remove(removeIndex);
    }
    setRemoveIndex(null);
  };

  const handleRemoveCancel = () => {
    setRemoveIndex(null);
  };

  const formId = `${name}-add-form`;
  const gridFieldIds = mapping.gridFields ?? [];
  const gridFields = mapping.fields.filter((f) => gridFieldIds.includes(f.id));
  const remainingFields = mapping.fields.filter(
    (f) => !gridFieldIds.includes(f.id),
  );

  const removeItem =
    removeIndex !== null
      ? (fields[removeIndex] as unknown as Record<string, string>)
      : null;
  const removeItemLabel =
    removeItem && getItemLabel ? getItemLabel(removeItem) : undefined;

  return (
    <div>
      {fields.map((field, index) => {
        const item = field as unknown as Record<string, string>;
        const itemLabel = getItemLabel ? getItemLabel(item) : undefined;

        return (
          <DynamicListItem
            key={field.id}
            onEdit={() => handleEdit(index)}
            onRemove={() => handleRemoveRequest(index)}
            itemLabel={itemLabel}
          >
            {renderItem(item)}
          </DynamicListItem>
        );
      })}

      {fields.length < maxItems && (
        <Button
          onClick={handleAdd}
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
        >
          Add {label}
        </Button>
      )}

      {/* Add / Edit dialog */}
      <AppModal
        open={showForm}
        onClose={handleCancel}
        maxWidth={600}
        title={editingIndex !== null ? `Edit ${label}` : `Add ${label}`}
        actions={[
          {
            label: "Save",
            onClick: () => {
              const formEl = document.getElementById(
                formId,
              ) as HTMLFormElement | null;
              formEl?.requestSubmit();
            },
            variant: "contained",
          },
          {
            label: "Cancel",
            onClick: handleCancel,
            variant: "text",
          },
        ]}
      >
        <Box
          component="form"
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(handleSave)(e);
          }}
        >
          {gridFields.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: { xs: 0, sm: 2 },
              }}
            >
              {gridFields.map((f) => (
                <FieldRenderer
                  key={f.id}
                  field={f}
                  control={
                    itemControl as unknown as Control<
                      Record<string, string | boolean | string[]>
                    >
                  }
                  errors={
                    itemErrors as FieldErrors<
                      Record<string, string | boolean | string[]>
                    >
                  }
                />
              ))}
            </Box>
          )}
          {remainingFields.map((f) => (
            <FieldRenderer
              key={f.id}
              field={f}
              control={
                itemControl as unknown as Control<
                  Record<string, string | boolean | string[]>
                >
              }
              errors={
                itemErrors as FieldErrors<
                  Record<string, string | boolean | string[]>
                >
              }
            />
          ))}
        </Box>
      </AppModal>

      {/* Remove confirmation dialog */}
      <AppModal
        open={removeIndex !== null}
        onClose={handleRemoveCancel}
        maxWidth={400}
        title={`Remove ${label}?`}
        role="alertdialog"
        actions={[
          {
            label: "Remove",
            onClick: handleRemoveConfirm,
            variant: "contained",
            color: "error",
          },
          {
            label: "Cancel",
            onClick: handleRemoveCancel,
            variant: "text",
          },
        ]}
      >
        <DialogContentText>
          {removeItemLabel
            ? `Remove ${removeItemLabel}? This cannot be undone.`
            : `Are you sure you want to remove this ${label.toLowerCase()}? This cannot be undone.`}
        </DialogContentText>
      </AppModal>
    </div>
  );
}
