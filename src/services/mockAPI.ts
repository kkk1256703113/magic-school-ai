import { 
  OCRResponse, 
  FormulaResponse, 
  VisualizationResponse, 
  ContentAnalysisResponse 
} from '../types'
import { logger } from '../utils/logger'

/**
 * 模拟API服务 - 用于演示和测试
 * 当真实API不可用时提供完整的功能展示
 */
export class MockAPIService {
  private simulateDelay = (min: number = 800, max: number = 2000): Promise<void> => {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 模拟OCR文字识别
   */
  async extractText(file: File): Promise<OCRResponse> {
    logger.info('🔧 使用模拟OCR识别', { fileName: file.name }, 'MockAPI')
    await this.simulateDelay(1000, 1500)
    
    return {
      text: `从文件 "${file.name}" 中提取的模拟文本内容。这里通常包含文档中的所有文字。`,
      confidence: 0.94,
      blocks: [
        {
          text: "标题部分",
          position: { x: 10, y: 10, width: 200, height: 30 },
          confidence: 0.98
        },
        {
          text: "正文内容",
          position: { x: 10, y: 50, width: 300, height: 100 },
          confidence: 0.92
        }
      ]
    }
  }

  /**
   * 模拟公式解析
   */
  async parseFormulas(file: File): Promise<FormulaResponse> {
    logger.info('🔧 使用模拟公式解析', { fileName: file.name }, 'MockAPI')
    await this.simulateDelay(1200, 1800)
    
    return {
      formulas: [
        {
          latex: "y = x",
          category: "math",
          explanation: "这是一个基本的线性函数，表示y与x呈正比例关系",
          difficulty: "basic",
          confidence: 0.96
        },
        {
          latex: "f(x) = x",
          category: "math",
          explanation: "函数表示法：f(x)等于x",
          difficulty: "basic",
          confidence: 0.94
        }
      ]
    }
  }

  /**
   * 模拟可视化生成
   */
  async generateVisualization(data: any, style: string = 'modern'): Promise<VisualizationResponse> {
    logger.info('🔧 使用模拟可视化生成', { dataType: typeof data, style }, 'MockAPI')
    await this.simulateDelay(1500, 2500)
    
    // 生成Chart.js配置用于y=x函数
    const chartConfig = {
      type: 'line',
      data: {
        labels: [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10],
        datasets: [{
          label: 'y = x',
          data: [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          tension: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '线性函数 y = x 的图像',
            font: { size: 16 }
          },
          legend: {
            display: true,
            position: 'top' as const
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'x' },
            grid: { display: true }
          },
          y: {
            title: { display: true, text: 'y' },
            grid: { display: true }
          }
        }
      }
    }

    // SVG代码生成
    const svgCode = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .axis { stroke: #666; stroke-width: 1; }
            .line { stroke: #3b82f6; stroke-width: 2; fill: none; }
            .point { fill: #3b82f6; r: 3; }
            .label { font-family: Arial; font-size: 12px; fill: #333; }
          </style>
        </defs>
        
        <!-- 坐标轴 -->
        <line x1="50" y1="250" x2="350" y2="250" class="axis"/>
        <line x1="200" y1="50" x2="200" y2="250" class="axis"/>
        
        <!-- y=x线 -->
        <line x1="50" y1="250" x2="350" y2="50" class="line"/>
        
        <!-- 关键点 -->
        <circle cx="200" cy="150" class="point"/>
        <circle cx="250" cy="100" class="point"/>
        <circle cx="150" cy="200" class="point"/>
        
        <!-- 标签 -->
        <text x="360" y="255" class="label">x</text>
        <text x="205" y="45" class="label">y</text>
        <text x="205" y="270" class="label">O</text>
        <text x="320" y="70" class="label">y = x</text>
      </svg>
    `

    return {
      generatedImage: "data:image/svg+xml;base64," + btoa(svgCode),
      codeOptions: {
        chartjs: {
          config: chartConfig,
          description: "使用Chart.js创建的y=x线性函数图表，支持交互和响应式设计"
        },
        svg: {
          code: svgCode,
          description: "纯SVG绘制的y=x函数图像，轻量级且可缩放"
        },
        d3: {
          code: `
// D3.js 实现 y=x 函数图
const margin = {top: 20, right: 30, bottom: 30, left: 40};
const width = 400 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 比例尺
const xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
const yScale = d3.scaleLinear().domain([-10, 10]).range([height, 0]);

// 坐标轴
g.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(xScale));
g.append("g").call(d3.axisLeft(yScale));

// 线条生成器
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y));

// 数据
const data = Array.from({length: 21}, (_, i) => ({x: i-10, y: i-10}));

// 绘制线条
g.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "#3b82f6")
  .attr("stroke-width", 2)
  .attr("d", line);
          `,
          description: "使用D3.js创建的动态y=x函数图表，支持数据绑定和动画"
        }
      }
    }
  }

  /**
   * 模拟内容分析
   */
  async analyzeContent(content: string, images?: File[]): Promise<ContentAnalysisResponse> {
    logger.info('🔧 使用模拟内容分析', { 
      contentLength: content.length,
      imagesCount: images?.length || 0
    }, 'MockAPI')
    
    await this.simulateDelay(1000, 1800)
    
    // 智能分析输入内容
    const isFormula = /[=\+\-\*\/\^\(\)xy]/.test(content)
    const hasEquals = content.includes('=')
    
    let subject = "数学"
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = "beginner"
    let tags = ["基础数学"]
    let keyTopics = ["代数"]
    
    if (isFormula) {
      if (hasEquals && content.includes('x') && content.includes('y')) {
        subject = "代数几何"
        tags = ["线性函数", "坐标几何", "函数图像", "一次函数"]
        keyTopics = ["线性关系", "函数概念", "坐标系", "图像分析"]
      } else if (content.includes('x')) {
        subject = "代数"
        tags = ["函数", "变量", "表达式"]
        keyTopics = ["函数定义", "变量关系"]
      }
    }

    return {
      subject,
      difficulty,
      estimatedTime: 15,
      tags,
      learningObjectives: [
        "理解线性函数y=x的基本概念",
        "掌握一次函数的图像特征", 
        "学会在坐标系中绘制函数图像",
        "理解函数中自变量与因变量的关系"
      ],
      prerequisites: [
        "基础代数运算",
        "坐标系概念",
        "函数的基本定义"
      ],
      category: "基础数学教育",
      keyTopics,
      suggestions: [
        "从具体数值开始，如当x=1时，y=1",
        "使用坐标纸绘制几个关键点",
        "观察图像是一条通过原点的直线",
        "理解斜率为1的含义",
        "练习相关的线性函数变式"
      ],
      confidence: 0.95
    }
  }

  /**
   * 获取API状态
   */
  getAPIStatus() {
    return {
      isConfigured: true,
      isMockMode: true,
      message: "使用模拟API进行功能演示",
      models: {
        deepSeekVL2: "模拟-视觉理解",
        janusPro: "模拟-图像生成", 
        gpt5: "模拟-文本分析"
      },
      settings: {
        maxFileSize: 10485760,
        requestTimeout: 30000,
        maxConcurrentRequests: 3,
        debugMode: true
      }
    }
  }
}

// 导出模拟服务实例
export const mockAPIService = new MockAPIService()
