import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import FieldRenderer from "./FieldRenderer";
import AddListItem from "./DynamicListItem";
import type { FieldDefinition } from "../../config/fields/types";

type AddListFieldMapping<T extends Record<string, string>> = {
  fields: FieldDefinition[];
  fieldToKey: T;
  gridFields?: string[];
};

type AddListProps<T extends Record<string, string>> = {
  control: Control<Record<string, any>>;
  name: string;
  label: string;
  mapping: AddListFieldMapping<T>;
  renderItem: (item: Record<string, string>) => React.ReactNode;
};

export default function AddList<T extends Record<string, string>>({
  control,
  name,
  label,
  mapping,
  renderItem,
}: AddListProps<T>) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const formId = `${name}-add-form`;
  const gridFieldIds = mapping.gridFields ?? [];
  const gridFields = mapping.fields.filter((f) => gridFieldIds.includes(f.id));
  const remainingFields = mapping.fields.filter(
    (f) => !gridFieldIds.includes(f.id),
  );

  return (
    <div>
      {fields.map((field, index) => {
        const item = field as unknown as Record<string, string>;
        return (
          <AddListItem
            key={field.id}
            onEdit={() => handleEdit(index)}
            onRemove={() => remove(index)}
          >
            {renderItem(item)}
          </AddListItem>
        );
      })}

      <Button
        onClick={handleAdd}
        variant="outlined"
        fullWidth
        startIcon={<AddIcon />}
      >
        Add {label}
      </Button>

      <Dialog open={showForm} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? `Edit ${label}` : `Add ${label}`}
        </DialogTitle>
        <DialogContent>
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
                {gridFields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
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

            {remainingFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="submit" form={formId} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
