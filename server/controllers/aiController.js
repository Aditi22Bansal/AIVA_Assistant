import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Polyfill browser geometry APIs required by pdfjs-dist v5 (used internally by pdf-parse v2)
// @napi-rs/canvas is already a dependency of pdf-parse and provides these in Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
  try {
    const { DOMMatrix, DOMPoint, DOMRect } = require('@napi-rs/canvas');
    globalThis.DOMMatrix = DOMMatrix;
    globalThis.DOMPoint = DOMPoint;
    globalThis.DOMRect = DOMRect;
  } catch (e) {
    console.warn('Could not polyfill DOMMatrix from @napi-rs/canvas:', e.message);
  }
}

export const generateArticle = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_AI_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: false,
        message:
          "API key not configured. Please set GEMINI_AI_KEY environment variable.",
      });
    }

    const AI = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan != "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    // Convert word count to approximate token count (1 word ≈ 1.3 tokens)
    // Add buffer to ensure complete sentences and proper conclusions
    const maxTokens = Math.ceil(length * 1.5);

    // Enhance prompt to ensure complete sentences and proper article structure
    const enhancedPrompt = `${prompt}. Important: Write a complete, well-structured article with proper introductions, body paragraphs, and conclusions. Ensure all sentences are complete and the article ends naturally with a proper conclusion. Do not cut off mid-sentence.`;

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_AI_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: false,
        message:
          "API key not configured. Please set GEMINI_AI_KEY environment variable.",
      });
    }

    const AI = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan != "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    // Enhanced prompt to ensure complete titles and proper formatting
    const enhancedPrompt = `${prompt} 

Important requirements:
- Provide complete, finished blog titles (do not cut off mid-title)
- Ensure all categories are fully populated with titles
- Each title should be a complete, engaging phrase
- Finish all sections completely before ending the response`;

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200, // Increased further to ensure all titles are complete
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const clipdropApiKey = process.env.CLIPDROP_API_KEY;

    if (!clipdropApiKey) {
      return res.json({
        success: false,
        message:
          "CLIPDROP_API_KEY not configured. Please set the environment variable.",
      });
    }

    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    // Premium-only feature
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscribers.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    let data;
    try {
      const response = await axios.post(
        "https://clipdrop-api.co/text-to-image/v1",
        formData,
        {
          headers: {
            "x-api-key": clipdropApiKey,
            ...formData.getHeaders(),
          },
          responseType: "arraybuffer",
        }
      );
      data = response.data;
    } catch (axiosError) {
      console.error(
        "Clipdrop API Error:",
        axiosError.response?.data || axiosError.message
      );
      if (axiosError.response) {
        const status = axiosError.response.status;
        let errorMessage = "";
        try {
          const errorData = Buffer.from(axiosError.response.data).toString(
            "utf-8"
          );
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.error || parsed.message || "";
        } catch (e) {
          // If can't parse, use status text
        }

        if (status === 402) {
          return res.json({
            success: false,
            message:
              errorMessage ||
              "Clipdrop API quota exceeded or payment required. Please check your Clipdrop account or upgrade your plan.",
          });
        } else if (status === 401) {
          return res.json({
            success: false,
            message:
              errorMessage ||
              "Invalid Clipdrop API key. Please check your CLIPDROP_API_KEY environment variable.",
          });
        } else {
          return res.json({
            success: false,
            message:
              errorMessage ||
              `Clipdrop API error: ${axiosError.response.status} - ${axiosError.response.statusText}`,
          });
        }
      }
      return res.json({
        success: false,
        message: `Network error: ${axiosError.message || "Failed to connect to Clipdrop API"
          }`,
      });
    }

    if (!data || data.length === 0) {
      return res.json({
        success: false,
        message: "Received empty response from Clipdrop API.",
      });
    }

    const base64Image = `data:image/png;base64,${Buffer.from(data).toString(
      "base64"
    )}`;

    let secure_url;
    try {
      const uploadResult = await cloudinary.uploader.upload(base64Image);
      secure_url = uploadResult.secure_url;
    } catch (cloudinaryError) {
      console.error("Cloudinary Error:", cloudinaryError);
      return res.json({
        success: false,
        message: `Failed to upload image to Cloudinary: ${cloudinaryError.message || "Unknown error"
          }`,
      });
    }

    try {
      await sql` INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false
        })`;
    } catch (dbError) {
      console.error("Database Error:", dbError);
      return res.json({
        success: false,
        message: `Failed to save creation to database: ${dbError.message || "Unknown error"
          }`,
      });
    }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Unexpected Error:", error);
    res.json({
      success: false,
      message:
        error.message ||
        error.toString() ||
        "An unexpected error occurred while generating the image.",
    });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const clipdropApiKey = process.env.CLIPDROP_API_KEY;

    if (!clipdropApiKey) {
      return res.json({
        success: false,
        message:
          "CLIPDROP_API_KEY not configured. Please set the environment variable.",
      });
    }

    if (!req.file) {
      return res.json({
        success: false,
        message: "No image file provided.",
      });
    }

    const { userId } = req.auth();
    const plan = req.plan;

    // Premium-only feature
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscribers.",
      });
    }

    // Use Clipdrop API for background removal
    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(req.file.path));

    let data;
    try {
      const response = await axios.post(
        "https://clipdrop-api.co/remove-background/v1",
        formData,
        {
          headers: {
            "x-api-key": clipdropApiKey,
            ...formData.getHeaders(),
          },
          responseType: "arraybuffer",
        }
      );
      data = response.data;
    } catch (axiosError) {
      console.error(
        "Clipdrop Background Removal Error:",
        axiosError.response?.data || axiosError.message
      );
      if (axiosError.response) {
        const status = axiosError.response.status;
        let errorMessage = "";
        try {
          const errorData = Buffer.from(axiosError.response.data).toString(
            "utf-8"
          );
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.error || parsed.message || "";
        } catch (e) {
          // If can't parse, use status text
        }

        if (status === 402) {
          return res.json({
            success: false,
            message:
              errorMessage ||
              "Clipdrop API quota exceeded or payment required.",
          });
        } else if (status === 401) {
          return res.json({
            success: false,
            message: errorMessage || "Invalid Clipdrop API key.",
          });
        } else {
          return res.json({
            success: false,
            message: errorMessage || `Clipdrop API error: ${status}`,
          });
        }
      }
      return res.json({
        success: false,
        message: `Network error: ${axiosError.message || "Failed to connect to Clipdrop API"
          }`,
      });
    }

    if (!data || data.length === 0) {
      return res.json({
        success: false,
        message: "Received empty response from Clipdrop API.",
      });
    }

    const base64Image = `data:image/png;base64,${Buffer.from(data).toString(
      "base64"
    )}`;

    let secure_url;
    try {
      const uploadResult = await cloudinary.uploader.upload(base64Image);
      secure_url = uploadResult.secure_url;
    } catch (cloudinaryError) {
      console.error("Cloudinary Error:", cloudinaryError);
      return res.json({
        success: false,
        message: `Failed to upload image to Cloudinary: ${cloudinaryError.message || "Unknown error"
          }`,
      });
    }

    try {
      await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;
    } catch (dbError) {
      console.error("Database Error:", dbError);
      return res.json({
        success: false,
        message: `Failed to save creation to database: ${dbError.message || "Unknown error"
          }`,
      });
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      // Ignore file deletion errors
    }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Unexpected Error:", error);
    res.json({
      success: false,
      message:
        error.message ||
        error.toString() ||
        "An unexpected error occurred while removing the background.",
    });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        success: false,
        message: "No image file provided.",
      });
    }

    const { userId } = req.auth();
    const { object } = req.body;
    const plan = req.plan;

    // Premium-only feature
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscribers.",
      });
    }

    // Upload image to Cloudinary first
    let public_id;
    try {
      const uploadResult = await cloudinary.uploader.upload(req.file.path);
      public_id = uploadResult.public_id;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.json({
        success: false,
        message: `Failed to upload image: ${uploadError.message || "Unknown error"}`,
      });
    }

    // Use Cloudinary's gen_remove effect with prompt
    // This uses Cloudinary's AI to remove objects based on text description
    let secure_url;
    try {
      // Generate the transformation URL - try different formats
      let transformationUrl;

      // Use a highly precise and optimal prompt for exact object removal
      const objectPrompt = object.toLowerCase().trim();

      // Best prompt format: Be explicit but concise
      // Key words that work best: "only", the object name, and preservation instructions
      // Format optimized for Cloudinary's AI understanding
      const optimalPrompt = `${objectPrompt} only`;

      transformationUrl = cloudinary.url(public_id, {
        transformation: [
          {
            effect: `gen_remove:prompt_${optimalPrompt}`,
          }
        ],
        resource_type: "image",
      });

      console.log("Optimal prompt used:", optimalPrompt);

      console.log("Transformation URL:", transformationUrl);
      console.log("Object to remove:", objectPrompt);

      console.log("Trying transformation URL:", transformationUrl);

      // Fetch the transformed image with timeout
      const response = await axios.get(transformationUrl, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 second timeout
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept 2xx and 3xx
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("Received empty response from Cloudinary transformation");
      }

      // Upload the processed image back to Cloudinary
      const base64Image = `data:image/png;base64,${Buffer.from(response.data).toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(base64Image);
      secure_url = uploadResult.secure_url;

    } catch (cloudinaryError) {
      console.error("Cloudinary AI transformation error:", {
        message: cloudinaryError.message,
        code: cloudinaryError.code,
        response: cloudinaryError.response?.status,
        url: cloudinaryError.config?.url,
      });

      // If Cloudinary AI doesn't work, try alternative: use the original approach with Clipdrop
      // But we need a mask, so inform user about the limitation
      return res.json({
        success: false,
        message: `Object removal failed: ${cloudinaryError.message || "Unknown error"}. This feature requires Cloudinary AI add-on or a mask file. Please ensure your Cloudinary account has AI features enabled.`,
      });
    }

    // Clean up the original uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      // Ignore file deletion errors
    }

    try {
      await sql` INSERT INTO creations (user_id,prompt,content,type) values (${userId}, ${`Remove ${object} from image`}, ${secure_url}, 'image')`;
    } catch (dbError) {
      console.error("Database Error:", dbError);
      return res.json({
        success: false,
        message: `Failed to save creation to database: ${dbError.message || "Unknown error"
          }`,
      });
    }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


export const resumeReview = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_AI_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: false,
        message:
          "API key not configured. Please set GEMINI_AI_KEY environment variable.",
      });
    }

    if (!req.file) {
      return res.json({
        success: false,
        message: "No resume file provided.",
      });
    }

    const { userId } = req.auth();
    const resume = req.file;
    const jobDescription = req.body?.jobDescription || '';
    const plan = req.plan;

    // Premium-only feature
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscribers.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);

    // Parse PDF - pdf-parse v2 requires DOMMatrix (polyfilled above at module load)
    const pdfParseModule = require('pdf-parse');
    const PDFParseClass = pdfParseModule.PDFParse;

    if (!PDFParseClass || typeof PDFParseClass !== 'function') {
      return res.json({
        success: false,
        message: `PDF parsing error: pdf-parse module not loaded correctly. Please ensure pdf-parse v2+ is installed.`,
      });
    }

    // Instantiate PDFParse and extract text
    const pdfParser = new PDFParseClass({ data: dataBuffer });
    let pdfData;
    try {
      const result = await pdfParser.getText();
      pdfData = { text: typeof result === 'string' ? result : (result.text || '') };
    } finally {
      try { await pdfParser.destroy(); } catch (_) { }
    }

    // Get current date for accurate date interpretation
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentDateString = `${currentMonth}/${currentDate.getDate()}/${currentYear}`;

    const prompt = `You are an expert resume reviewer and career counselor. Review the following resume comprehensively and provide detailed, constructive feedback.

CRITICAL: DATE INTERPRETATION INSTRUCTIONS
- Current date: ${currentDateString} (Year: ${currentYear}, Month: ${currentMonth})
- You MUST carefully extract and interpret ALL date ranges from the resume text itself

IMPORTANT: DO NOT MENTION STUDENT'S CURRENT ACADEMIC YEAR
- DO NOT calculate or mention which year the student is currently in (e.g., "3rd year", "4th year", "final year")
- DO NOT make statements like "as a Xth-year student" or "currently in their Xth year"
- You may reference the program duration (e.g., "B.Tech program from 2023-2027") but DO NOT calculate or state their current year
- Focus on the program duration and dates mentioned in the resume, not the student's current academic standing

ACADEMIC YEAR RANGES:
- For academic year ranges like "2023-27", "2023-2027", "2023 - 2027", "2023–2027":
  1. Extract the START YEAR and END YEAR from the resume
  2. Use these dates to understand the program duration
  3. DO NOT calculate which year they are currently in
  4. Simply note the program span (e.g., "B.Tech program (2023-2027)")

PROJECT/WORK DATE VALIDATION:
- For dates like "Oct 2025", "Dec 2025", "Jan 2026", "Mar 2026", etc.:
  * If year < ${currentYear}: Date is in the past (VALID - do not flag)
  * If year = ${currentYear} AND month <= ${currentMonth}: Date is past or current (VALID - do not flag)
  * Only flag as "future dating" if year > ${currentYear}, OR (year = ${currentYear} AND month > ${currentMonth})

MANDATORY STEPS:
1. Read the entire resume text carefully
2. Extract ALL date ranges and individual dates mentioned
3. Calculate academic year using the formula above with ACTUAL extracted start year
4. Validate all project/work dates against current date (${currentDateString})
5. Do NOT make assumptions - use only dates found in the resume text
6. Do NOT flag valid dates as errors

PROVIDE A COMPREHENSIVE ANALYSIS INCLUDING:

1. **Executive Summary**: Overall assessment of the resume's strength and target audience fit

2. **Key Strengths** (at least 5-7 points):
   - Highlight achievements, skills, experiences, and formatting that stand out
   - Mention quantifiable accomplishments
   - Note unique selling points

3. **Areas for Improvement** (organized by priority):
   - **Critical Issues** (fix immediately): Only flag genuine errors, inconsistencies, or major problems
   - **Important Improvements**: Suggestions that would significantly strengthen the resume
   - **Minor Enhancements**: Polish and optimization suggestions

4. **Detailed Section-by-Section Analysis**:
   - Contact Information: Check completeness and professionalism
   - Professional Summary/Objective: Evaluate clarity and impact
   - Education: Review dates, GPA (if included), relevant coursework, honors
   - Work Experience/Internships: Analyze job descriptions, achievements, quantifiable results, date consistency
   - Projects: Evaluate descriptions, technologies used, impact/results
   - Skills: Check relevance, categorization, technical vs. soft skills
   - Certifications/Awards: Review relevance and presentation
   - Additional Sections: Evaluate any other sections present

5. **ATS (Applicant Tracking System) Optimization**:
   - Keyword optimization
   - Formatting for ATS compatibility
   - Section organization

6. **Actionable Recommendations**:
   - Specific, concrete suggestions for improvement
   - Prioritized action items
   - Examples of how to improve weak areas

7. **Target Role Assessment** (if role is inferable from resume):
   - Does the resume align with the apparent target role?
   - What's missing for that role?
   - What can be emphasized more?

Write in a professional, encouraging tone. Be specific with examples from the resume. Ensure all dates are interpreted correctly based on the current date context provided above.

${jobDescription ? `\n\nJOB DESCRIPTION ANALYSIS (TARGETED REVIEW):
A job description has been provided below. You MUST review the resume specifically against these job requirements:
1. **Job Fit Assessment**: How well does the resume align with the job requirements?
2. **Required Skills Match**: Identify which required skills/technologies are present in the resume and which are missing
3. **Experience Alignment**: Compare the candidate's experience with the job requirements
4. **Gap Analysis**: What's missing from the resume that the job requires?
5. **Tailoring Recommendations**: Specific suggestions on how to better align the resume with this job description
6. **Keyword Optimization**: Identify important keywords from the JD that should be emphasized in the resume

Job Description:
${jobDescription}

IMPORTANT: When a job description is provided, prioritize the job-fit analysis and alignment recommendations in your review.` : ''}

Resume content:
${pdfData.text}`;

    const AI = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000, // Increased for comprehensive analysis
    });

    const content = response.choices[0].message.content;

    await sql` INSERT INTO creations (user_id,prompt,content,type) values (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    // Clean up uploaded file
    try {
      fs.unlinkSync(resume.path);
    } catch (e) {
      // Ignore file deletion errors
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Resume Review Error:", error);
    res.json({
      success: false,
      message: error.message || "An unexpected error occurred while reviewing the resume.",
    });
  }
};
