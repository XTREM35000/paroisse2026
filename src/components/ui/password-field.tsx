import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'

export interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showToggle?: boolean
}

const PasswordField: React.FC<PasswordFieldProps> = ({ value, onChange, className, disabled, showToggle = true, ...rest }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        {...rest}
        type={visible ? 'text' : 'password'}
        autoComplete={rest.autoComplete ?? 'current-password'}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn('pr-10', rest.className)}
      />

      {showToggle && (
        <button
          type="button"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          onClick={() => setVisible(v => !v)}
          className="absolute right-2 h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

export default PasswordField
