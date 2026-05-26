import type { ReactNode } from "react";
import { panelSectionTitle } from "./styles";

type PanelSectionTitleProps = {
  children: ReactNode;
  action?: ReactNode;
};

export const PanelSectionTitle = ({
  children,
  action,
}: PanelSectionTitleProps) => (
  <div className="mb-2.5 flex items-center justify-between gap-2">
    <p className={panelSectionTitle}>{children}</p>
    {action}
  </div>
);
