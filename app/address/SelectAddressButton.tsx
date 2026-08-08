"use client";

import { useFormStatus } from "react-dom";
import styles from "./page.module.css";

type SelectAddressButtonProps = {
  isSelected: boolean;
};

export default function SelectAddressButton({
  isSelected,
}: SelectAddressButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={styles.secondaryButton}
      disabled={isSelected || pending}
      type="submit"
    >
      {pending ? (
        <span className={styles.loadingLabel}>
          <span aria-hidden="true" className={styles.spinner} />
          Selecting...
        </span>
      ) : isSelected ? (
        "Selected Address"
      ) : (
        "Use This Address"
      )}
    </button>
  );
}
