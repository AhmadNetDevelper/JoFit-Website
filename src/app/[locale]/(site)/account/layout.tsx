/**
 * The account area has no chrome of its own at layout level: each page renders
 * `PortalShell`, because only a page knows which tab it is, and each page runs
 * `accountFrame`, which is the sign-in gate. A gate here as well would add
 * nothing — the layout cannot know the path to send someone back to.
 */
export default function AccountLayout({ children }: LayoutProps<"/[locale]/account">) {
  return children;
}
