export type UseClipboardReturn = {
  copied: boolean
  copy: (text: string) => Promise<void>
}

export function useClipboard(timeout = 1500): UseClipboardReturn {
  const [copied, setCopied] = useState(false)

  async function copy(text: string): Promise<void> {
    if (!navigator?.clipboard) {
      return
    }

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), timeout)
  }

  return { copied, copy }
}
