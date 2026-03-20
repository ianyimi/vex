import { AuthView } from "@daveyplate/better-auth-ui"
import { Activity } from "react"

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog"

export default function AuthCard({ pathname }: { pathname: string }) {
  return (
    <main>
      <Dialog open>
        <Activity mode="hidden">
          <DialogTitle />
        </Activity>
        <DialogContent
          aria-describedby={undefined}
          className="grid place-items-center border-none bg-transparent shadow-none"
          showCloseButton={false}
        >
          <AuthView path={pathname} />
        </DialogContent>
      </Dialog>
    </main>
  )
}
