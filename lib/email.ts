// Simple email utility for development
// In production, you would use a service like SendGrid, Mailgun, or AWS SES

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  // For development, we'll just log the email
  // In production, this would send an actual email
  console.log('📧 EMAIL SENT:')
  console.log('To:', data.to)
  console.log('Subject:', data.subject)
  console.log('HTML:', data.html)
  console.log('---')
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // For development, we'll always return true
  // In production, this would return the actual result from the email service
  return true
}

export function generateInvitationEmail(
  employeeName: string,
  employeeEmail: string,
  companyName: string,
  temporaryPassword: string | undefined,
  loginUrl: string,
  invitationUrl: string,
  isExistingUser: boolean = false
): EmailData {
  const subject = `Inbjudan till ${companyName} - Utbildningsplattform`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Inbjudan till utbildningsplattform</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Välkommen till ${companyName}!</h2>
        
        <p>Hej ${employeeName},</p>
        
        <p>Du har blivit inbjuden att använda ${companyName}s utbildningsplattform för säkerhets- och arbetsutbildning.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dina inloggningsuppgifter:</h3>
          <p><strong>E-post:</strong> ${employeeEmail}</p>
          ${isExistingUser
            ? '<p><strong>Lösenord:</strong> Ditt befintliga lösenord</p>'
            : temporaryPassword
              ? `<p><strong>Temporärt lösenord:</strong> ${temporaryPassword}</p>`
              : '<p><strong>Lösenord:</strong> Du kommer att skapa ditt lösenord när du skapar ditt konto</p>'
          }
          <p><strong>Inloggningslänk:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Alternativ inbjudningslänk:</strong> <a href="${invitationUrl}">${invitationUrl}</a></p>
        </div>
        
        <h3>Vad händer nu?</h3>
        <ol>
          ${isExistingUser
            ? '<li>Logga in med dina befintliga uppgifter</li>'
            : '<li>Skapa ditt konto via inbjudningslänken</li>'
          }
          <li>Verifiera din identitet med BankID</li>
          <li>Börja ta dina tilldelade kurser</li>
          <li>Få ditt ID06-certifikat efter genomförd kurs</li>
        </ol>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;"><strong>Viktigt:</strong> Du måste verifiera din identitet med BankID för att kunna ta kurser och få ID06-certifikat.</p>
        </div>
        
        <p>Om du har frågor, kontakta din företagsadministratör.</p>
        
        <p>Välkommen!</p>
        <p>${companyName} Team</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Välkommen till ${companyName}!
    
    Hej ${employeeName},
    
    Du har blivit inbjuden att använda ${companyName}s utbildningsplattform för säkerhets- och arbetsutbildning.
    
    Dina inloggningsuppgifter:
    - E-post: ${employeeEmail}
    ${isExistingUser
      ? '- Lösenord: Ditt befintliga lösenord'
      : temporaryPassword
        ? `- Temporärt lösenord: ${temporaryPassword}`
        : '- Lösenord: Du kommer att skapa ditt lösenord när du skapar ditt konto'
    }
    - Inloggningslänk: ${loginUrl}
    - Alternativ inbjudningslänk: ${invitationUrl}

    Vad händer nu?
    ${isExistingUser
      ? '1. Logga in med dina befintliga uppgifter'
      : '1. Skapa ditt konto via inbjudningslänken'
    }
    2. Verifiera din identitet med BankID
    3. Börja ta dina tilldelade kurser
    4. Få ditt ID06-certifikat efter genomförd kurs

    Viktigt: Du måste verifiera din identitet med BankID för att kunna ta kurser och få ID06-certifikat.

    Om du har frågor, kontakta din företagsadministratör.

    Välkommen!
    ${companyName} Team
  `

  return { to: employeeEmail, subject, html, text }
}

// For production, you would implement real email sending here
// Example with a service like Resend:
/*
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    const result = await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    })
    
    return result.error === null
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}
*/
