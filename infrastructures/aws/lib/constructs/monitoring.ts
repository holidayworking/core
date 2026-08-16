import { CfnDashboard } from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export class Monitoring extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new CfnDashboard(this, "ClaudeCodeDashboard", {
      dashboardName: "ClaudeCode",
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "text",
            x: 0,
            y: 0,
            width: 24,
            height: 2,
            properties: {
              markdown: "## Executive Summary\nKey totals for the current filter selection.",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 2,
            width: 6,
            height: 4,
            properties: {
              title: "Total Tokens",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*"})',
                    step: 60,
                    label: "Tokens",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                  numberOptions: {
                    sparkline: true,
                  },
                  pieOptions: {
                    innerSize: "50%",
                  },
                  barOptions: {},
                  gaugeOptions: {},
                },
              },
            },
          },
          {
            type: "chart",
            x: 6,
            y: 2,
            width: 6,
            height: 4,
            properties: {
              title: "Total Cost (USD)",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.cost.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*"})',
                    step: 60,
                    label: "Cost",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                  numberOptions: {
                    sparkline: true,
                  },
                  pieOptions: {
                    innerSize: "50%",
                  },
                  barOptions: {},
                  gaugeOptions: {},
                },
              },
            },
          },
          {
            type: "chart",
            x: 12,
            y: 2,
            width: 6,
            height: 4,
            properties: {
              title: "Sessions",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.session.count", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"})',
                    step: 60,
                    label: "Sessions",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                  numberOptions: {
                    sparkline: true,
                  },
                  pieOptions: {
                    innerSize: "50%",
                  },
                  barOptions: {},
                  gaugeOptions: {},
                },
              },
            },
          },
          {
            type: "chart",
            x: 18,
            y: 2,
            width: 6,
            height: 4,
            properties: {
              title: "Active Hours",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.active_time.total", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}) / 3600',
                    step: 60,
                    label: "Hours",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                  numberOptions: {
                    sparkline: true,
                  },
                  pieOptions: {
                    innerSize: "50%",
                  },
                  barOptions: {},
                  gaugeOptions: {},
                },
              },
            },
          },
          {
            type: "text",
            x: 0,
            y: 6,
            width: 24,
            height: 2,
            properties: {
              markdown:
                "## Usage & Cost\nToken consumption and spend over time, pivoted by your selected grouping.",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 8,
            width: 12,
            height: 6,
            properties: {
              title: "Token Usage Over Time",
              view: "line",
              data: {
                queries: [
                  {
                    id: "total",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*"})',
                    step: 60,
                    label: "Total Tokens",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: true,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 12,
            y: 8,
            width: 12,
            height: 6,
            properties: {
              title: "Token Usage by Model",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (model)({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: true,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 0,
            y: 14,
            width: 12,
            height: 6,
            properties: {
              title: "Cost by Model (USD)",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (model)({"claude_code.cost.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: true,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 12,
            y: 14,
            width: 12,
            height: 6,
            properties: {
              title: "Token Usage by Type",
              view: "line",
              data: {
                queries: [
                  {
                    id: "input",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*", type="input"})',
                    step: 60,
                    label: "Input",
                  },
                  {
                    id: "output",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*", type="output"})',
                    step: 60,
                    label: "Output",
                  },
                  {
                    id: "cache",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*", type="cacheRead"})',
                    step: 60,
                    label: "Cache Read",
                  },
                  {
                    id: "cacheCreate",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.token.usage", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", model=~".*", type="cacheCreation"})',
                    step: 60,
                    label: "Cache Creation",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "text",
            x: 0,
            y: 20,
            width: 24,
            height: 2,
            properties: {
              markdown:
                "## Developer Productivity\nCode output, commits, active time, and pull requests - broken down by your selected grouping.",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 22,
            width: 6,
            height: 6,
            properties: {
              title: "Lines of Code",
              view: "line",
              data: {
                queries: [
                  {
                    id: "added",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.lines_of_code.count", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", type="added"})',
                    step: 60,
                    label: "Added",
                  },
                  {
                    id: "removed",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum({"claude_code.lines_of_code.count", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*", type="removed"})',
                    step: 60,
                    label: "Removed",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 6,
            y: 22,
            width: 6,
            height: 6,
            properties: {
              title: "Commits by Model",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (model)({"claude_code.commit.count", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: true,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 12,
            y: 22,
            width: 6,
            height: 6,
            properties: {
              title: "Active Hours by Model",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (model)({"claude_code.active_time.total", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}) / 3600)',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: true,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 18,
            y: 22,
            width: 6,
            height: 6,
            properties: {
              title: "Pull Requests by Model",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (model)({"claude_code.pull_request.count", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: true,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "text",
            x: 0,
            y: 28,
            width: 24,
            height: 2,
            properties: {
              markdown:
                "## Code Editing\nEdit-tool activity by language, decision, and tool - dimensions specific to these metrics.",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 30,
            width: 8,
            height: 6,
            properties: {
              title: "Code Generation by Language",
              view: "pie",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (language)({"claude_code.code_edit_tool.decision", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: true,
                    stacked: true,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 8,
            y: 30,
            width: 8,
            height: 6,
            properties: {
              title: "Code Edit Decisions",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (decision)({"claude_code.code_edit_tool.decision", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 16,
            y: 30,
            width: 8,
            height: 6,
            properties: {
              title: "Code Edits by Tool",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'topk(15, sum by (tool_name)({"claude_code.code_edit_tool.decision", organization=~".*", "department"=~".*", "team.id"=~".*", "user.email"=~".*", cost_center=~".*", location=~".*", role=~".*"}))',
                    step: 60,
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                xAxis: {
                  type: "datetime",
                },
                yAxis: [
                  {
                    type: "linear",
                  },
                ],
                style: {
                  lineOptions: {
                    filled: false,
                    stacked: false,
                    width: 2,
                    pattern: "solid",
                    spline: false,
                  },
                },
              },
            },
          },
        ],
      }),
    });
  }
}
