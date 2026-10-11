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

    new CfnDashboard(this, "OpenWRTDashboard", {
      dashboardName: "OpenWRT",
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "text",
            x: 0,
            y: 0,
            width: 24,
            height: 1,
            properties: {
              markdown: "## Overview",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 1,
            width: 6,
            height: 6,
            properties: {
              title: "Uptime (seconds)",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum(node_time_seconds{"@resource.service.name"="openwrt"}) - sum(node_boot_time_seconds{"@resource.service.name"="openwrt"})',
                    step: 60,
                    label: "Uptime",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  numberOptions: {
                    sparkline: true,
                    truncate: true,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 6,
            y: 1,
            width: 6,
            height: 6,
            properties: {
              title: "CPU Busy",
              view: "solidgauge",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      '(((count(count({__name__="node_cpu_seconds_total","@resource.service.name"="openwrt"}) by (cpu))) - avg(sum by (mode)((avg_over_time({__name__="node_cpu_seconds_total",mode="idle","@resource.service.name"="openwrt"}[5m]) / 60)))) * 100) / count(count({__name__="node_cpu_seconds_total","@resource.service.name"="openwrt"}) by (cpu))',
                    step: 60,
                    label: "CPU Busy",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  gaugeOptions: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 12,
            y: 1,
            width: 6,
            height: 6,
            properties: {
              title: "Used RAM Memory",
              view: "solidgauge",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      '100 - ((node_memory_MemAvailable_bytes{"@resource.service.name"="openwrt"} * 100) / node_memory_MemTotal_bytes{"@resource.service.name"="openwrt"})',
                    step: 60,
                    label: "Used RAM",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  gaugeOptions: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 18,
            y: 1,
            width: 6,
            height: 6,
            properties: {
              title: "Conntrack Usage",
              view: "solidgauge",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum(node_nf_conntrack_entries{"@resource.service.name"="openwrt"}) / sum(node_nf_conntrack_entries_limit{"@resource.service.name"="openwrt"}) * 100',
                    step: 60,
                    label: "Conntrack",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  gaugeOptions: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 0,
            y: 7,
            width: 6,
            height: 6,
            properties: {
              title: "WAN Download (Mbps)",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum(avg_over_time(node_network_receive_bytes_total{"@resource.service.name"="openwrt",device="eth4"}[2m])) / 60 * 8 / 1000000',
                    step: 60,
                    label: "Download",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  numberOptions: {
                    sparkline: true,
                    truncate: true,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 6,
            y: 7,
            width: 6,
            height: 6,
            properties: {
              title: "WAN Upload (Mbps)",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum(avg_over_time(node_network_transmit_bytes_total{"@resource.service.name"="openwrt",device="eth4"}[2m])) / 60 * 8 / 1000000',
                    step: 60,
                    label: "Upload",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  numberOptions: {
                    sparkline: true,
                    truncate: true,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 12,
            y: 7,
            width: 6,
            height: 6,
            properties: {
              title: "WAN Traffic (last 24h, bytes)",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum(sum_over_time(node_network_transmit_bytes_total{"@resource.service.name"="openwrt",device="eth4"}[24h])) + sum(sum_over_time(node_network_receive_bytes_total{"@resource.service.name"="openwrt",device="eth4"}[24h]))',
                    step: 60,
                    label: "WAN (24h)",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  numberOptions: {
                    sparkline: true,
                    truncate: true,
                  },
                },
              },
            },
          },
          {
            type: "chart",
            x: 18,
            y: 7,
            width: 6,
            height: 6,
            properties: {
              title: "Wifi Clients",
              view: "number",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'sum(wifi_stations{"@resource.service.name"="openwrt"})',
                    step: 60,
                    label: "Wifi Clients",
                  },
                ],
              },
              plotOptions: {
                legend: {
                  position: "bottom",
                  show: true,
                },
                style: {
                  numberOptions: {
                    sparkline: true,
                    truncate: true,
                  },
                },
              },
            },
          },
          {
            type: "text",
            x: 0,
            y: 14,
            width: 24,
            height: 1,
            properties: {
              markdown: "## CPU / Memory",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 15,
            width: 12,
            height: 12,
            properties: {
              title: "CPU",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum((avg_over_time({__name__="node_cpu_seconds_total",mode="system","@resource.service.name"="openwrt"}[5m]) / 60)) * 100',
                    step: 60,
                    label: "System",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum((avg_over_time({__name__="node_cpu_seconds_total",mode="user","@resource.service.name"="openwrt"}[5m]) / 60)) * 100',
                    step: 60,
                    label: "User",
                  },
                  {
                    id: "d",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum((avg_over_time({__name__="node_cpu_seconds_total",mode="idle","@resource.service.name"="openwrt"}[5m]) / 60)) * 100',
                    step: 60,
                    label: "Idle",
                  },
                  {
                    id: "e",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum((avg_over_time({__name__="node_cpu_seconds_total",mode="iowait","@resource.service.name"="openwrt"}[5m]) / 60)) * 100',
                    step: 60,
                    label: "Iowait",
                  },
                  {
                    id: "f",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum((avg_over_time({__name__="node_cpu_seconds_total",mode="irq","@resource.service.name"="openwrt"}[5m]) / 60)) * 100',
                    step: 60,
                    label: "Irq",
                  },
                  {
                    id: "g",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum((avg_over_time({__name__="node_cpu_seconds_total",mode="softirq","@resource.service.name"="openwrt"}[5m]) / 60)) * 100',
                    step: 60,
                    label: "Softirq",
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
                    title: "%",
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
            x: 12,
            y: 15,
            width: 12,
            height: 12,
            properties: {
              title: "Memory",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'node_memory_MemTotal_bytes{"@resource.service.name"="openwrt"} - node_memory_MemFree_bytes{"@resource.service.name"="openwrt"} - node_memory_Buffers_bytes{"@resource.service.name"="openwrt"} - node_memory_Cached_bytes{"@resource.service.name"="openwrt"} - node_memory_Slab_bytes{"@resource.service.name"="openwrt"} - node_memory_PageTables_bytes{"@resource.service.name"="openwrt"} - node_memory_SwapCached_bytes{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Apps",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_memory_PageTables_bytes{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "PageTables",
                  },
                  {
                    id: "d",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_memory_Slab_bytes{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Slab",
                  },
                  {
                    id: "e",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_memory_Cached_bytes{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Cache",
                  },
                  {
                    id: "f",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_memory_Buffers_bytes{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Buffers",
                  },
                  {
                    id: "g",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_memory_MemFree_bytes{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Unused",
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
                    title: "Bytes",
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
            type: "text",
            x: 0,
            y: 28,
            width: 24,
            height: 1,
            properties: {
              markdown: "## System Detail",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 29,
            width: 12,
            height: 8,
            properties: {
              title: "Context Switches / Interrupts",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      '(avg_over_time(node_context_switches_total{"@resource.service.name"="openwrt"}[5m]) / 60)',
                    step: 60,
                    label: "Context switches",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      '(avg_over_time(node_intr_total{"@resource.service.name"="openwrt"}[5m]) / 60)',
                    step: 60,
                    label: "Interrupts",
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
                    title: "Counter/sec",
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
            x: 12,
            y: 29,
            width: 12,
            height: 8,
            properties: {
              title: "System Load",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_load1{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Load 1m",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_load5{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Load 5m",
                  },
                  {
                    id: "c",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_load15{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "Load 15m",
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
                    title: "Load",
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
            y: 38,
            width: 24,
            height: 1,
            properties: {
              markdown: "## WiFi",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 39,
            width: 12,
            height: 8,
            properties: {
              title: "WiFi Stations by interface",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'sum by (ifname) (wifi_stations{"@resource.service.name"="openwrt"})',
                    step: 60,
                    label: "__verbose__",
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
                    title: "Stations",
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
            x: 12,
            y: 39,
            width: 12,
            height: 8,
            properties: {
              title: "WiFi Station Signal",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'sum by (mac, ifname) (wifi_station_signal_dbm{"@resource.service.name"="openwrt"})',
                    step: 60,
                    label: "__verbose__",
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
                    title: "dBm",
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
            y: 48,
            width: 24,
            height: 1,
            properties: {
              markdown: "## Network Traffic",
              background: "transparent",
            },
          },
          {
            type: "chart",
            x: 0,
            y: 49,
            width: 12,
            height: 8,
            properties: {
              title: "Network Traffic by Bytes",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace((sum by (device) ((avg_over_time({__name__="node_network_receive_bytes_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60))) / 1024, "direction", "Receive", "", "")',
                    step: 60,
                    label: "__verbose__",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace((sum by (device) ((avg_over_time({__name__="node_network_transmit_bytes_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60))) / 1024, "direction", "Transmit", "", "")',
                    step: 60,
                    label: "__verbose__",
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
                    title: "KB/s",
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
            x: 12,
            y: 49,
            width: 12,
            height: 8,
            properties: {
              title: "Network Traffic by Packets",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace(sum by (device) ((avg_over_time({__name__="node_network_transmit_packets_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60)), "direction", "Transmit", "", "")',
                    step: 60,
                    label: "__verbose__",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace(sum by (device) ((avg_over_time({__name__="node_network_receive_packets_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60)), "direction", "Receive", "", "")',
                    step: 60,
                    label: "__verbose__",
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
                    title: "Packets/sec",
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
            x: 0,
            y: 57,
            width: 12,
            height: 8,
            properties: {
              title: "Network Traffic Drop",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace(sum by (device) ((avg_over_time({__name__="node_network_receive_drop_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60)), "direction", "Receive", "", "")',
                    step: 60,
                    label: "__verbose__",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace(sum by (device) ((avg_over_time({__name__="node_network_transmit_drop_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60)), "direction", "Transmit", "", "")',
                    step: 60,
                    label: "__verbose__",
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
                    title: "Packets/sec",
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
            x: 12,
            y: 57,
            width: 12,
            height: 8,
            properties: {
              title: "Network Traffic Errors",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace(sum by (device) ((avg_over_time({__name__="node_network_receive_errs_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60)), "direction", "Receive", "", "")',
                    step: 60,
                    label: "__verbose__",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query:
                      'label_replace(sum by (device) ((avg_over_time({__name__="node_network_transmit_errs_total","@resource.service.name"="openwrt",device=~"eth4|ds-dslite|br-lan|ath.*|tailscale0"}[5m]) / 60)), "direction", "Transmit", "", "")',
                    step: 60,
                    label: "__verbose__",
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
                    title: "Packets/sec",
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
            x: 0,
            y: 65,
            width: 12,
            height: 8,
            properties: {
              title: "NF Conntrack",
              view: "line",
              data: {
                queries: [
                  {
                    id: "a",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_nf_conntrack_entries{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "NF conntrack entries",
                  },
                  {
                    id: "b",
                    type: "cloudwatch-metrics",
                    language: "PromQL",
                    query: 'node_nf_conntrack_entries_limit{"@resource.service.name"="openwrt"}',
                    step: 60,
                    label: "NF conntrack limit",
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
                    title: "Entries",
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
