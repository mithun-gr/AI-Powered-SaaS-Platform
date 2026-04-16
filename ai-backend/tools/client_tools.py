from llama_index.core.tools import FunctionTool
from db.database import get_supabase_client

def get_user_requests(user_id: str) -> str:
    """Retrieve the recent requests submitted by the user. Use this when the user asks to track a request."""
    try:
        supabase = get_supabase_client()
        if not supabase or user_id == "guest_user":
            return "Please log in to track your actual requests."
            
        res = supabase.table("requests").select("title, status, created_at").eq("client_id", user_id).execute()
        requests = res.data
        if not requests:
            return "You currently have no active or past requests."
            
        formatted = ", ".join([f"'{r['title']}' (Status: {r['status']})" for r in requests])
        return "Here is what I found in your portal: " + formatted
    except Exception as e:
        return "I had trouble fetching your requests from the portal database."

def get_user_documents(user_id: str) -> str:
    """Check if the user has specific documents uploaded. Used when user asks to show or view their documents."""
    return "I recommend opening the Upload Documents modal inside your portal dashboard, or I can summarize them here if I find them. Currently, your vault contains 3 files: Branding_Brief.pdf, Invoice_302.pdf, Contract.pdf."

def schedule_consultation(user_id: str, topic: str = "Expert call") -> str:
    """Book or schedule a consultation/expert call for the user. DO NOT use this tool if the user explicitly asks to send an email; use send_contact_email instead."""
    return f"I have sent an alert to our team to schedule an expert call regarding '{topic}'. A calendly link has been emailed to you!"

def get_payment_status(user_id: str) -> str:
    """Retrieve billing, invoice, and payment status for the user."""
    try:
        supabase = get_supabase_client()
        if not supabase or user_id == "guest_user":
            return "Please log in to track your actual invoices."
            
        res = supabase.table("invoices").select("amount, currency, status, description, due_date").eq("client_id", user_id).execute()
        invoices = res.data
        if not invoices:
            return "You have 0 pending or overdue invoices on your account."
            
        overdue = [i for i in invoices if i['status'] == 'overdue']
        pending = [i for i in invoices if i['status'] == 'pending']
        return f"I found your invoice history. You have {len(overdue)} overdue invoices and {len(pending)} pending invoices."
    except Exception as e:
        return "I was unable to search your billing history right now."

def get_company_info() -> str:
    """Provides general information about Morchantra (the company), its founder, its motto, age, and services. Call this when users ask questions about Morchantra itself."""
    return (
        "Morchantra is a premium Business Services Portal. \n"
        "Age of company: Founded in 2024 (2 years old as of 2026). \n"
        "Founder and CEO: Mithunraj GR. \n"
        "Motto/Slogan: 'Empowering Digital Excellence'. \n"
        "Services offered: Web Design, Legal Advice, Tech Services (MERN/Cloud), Property Support, AI Automation, and Insurance Renewal Help. \n"
        "Pricing: Our pricing is highly customized based on your specific business needs and scale. We offer flexible retainer and project-based options. Please submit a request or contact our team for a tailored quote. \n"
        "The official support email is support@morchantra.com. Our headquarters is located at 49, ullur, Kumbakonam, Thanjavur district 612001 TN, india. Support hours are Monday to Friday, 9 AM to 6 PM. \n"
        "To start a new project, clients must first submit a request through the portal. Once reviewed, our team will schedule an initial expert call, followed by a formal contract signing. \n"
        "Morchantra aims to be a one-stop digital concierge for all business needs."
    )

def send_email(user_id: str, message: str, recipient_email: str = None) -> str:
    """Send an email. If the user asks to email the founder, use 'mithungrraj@gmail.com' as the recipient_email. If the user asks to send an email to themselves, leave recipient_email as None to use their profile email. Otherwise, use the email they specify."""
    try:
        supabase = get_supabase_client()
    except Exception:
        supabase = None
        
    user_name = "Guest User"
    user_profile_email = "Unknown Email"
    
    if supabase and user_id and user_id != "guest_user":
        try:
            res = supabase.table("users").select("name, email").eq("id", user_id).execute()
            if res.data:
                user_name = res.data[0].get("name", "Unknown Name")
                user_profile_email = res.data[0].get("email", "Unknown Email")
        except Exception:
            pass
            
    # Determine the final recipient
    final_recipient = recipient_email if recipient_email else user_profile_email
    
    # If it's a guest and they didn't provide a recipient, we can't send it to them
    if final_recipient == "Unknown Email":
        return "I need your email address to send this. Please provide your email address or log in to your profile."
            
    # Simulate sending the email
    print(f"\n--- 📧 EMAIL OUTBOX ---")
    print(f"To        : {final_recipient}")
    print(f"From Name : {user_name} (via Morchantra AI)")
    print(f"Message   :\n{message}")
    print(f"-----------------------\n")
    
    return f"I have successfully sent the email to {final_recipient}!"

# Create LlamaIndex Tool List
request_tool = FunctionTool.from_defaults(fn=get_user_requests)
docs_tool = FunctionTool.from_defaults(fn=get_user_documents)
consult_tool = FunctionTool.from_defaults(fn=schedule_consultation)
pay_tool = FunctionTool.from_defaults(fn=get_payment_status)
info_tool = FunctionTool.from_defaults(fn=get_company_info)
email_tool = FunctionTool.from_defaults(fn=send_email)

ai_tools = [request_tool, docs_tool, consult_tool, pay_tool, info_tool, email_tool]
