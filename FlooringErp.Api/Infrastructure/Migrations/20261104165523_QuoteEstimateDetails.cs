using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlooringErp.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class QuoteEstimateDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EstimateHigh",
                table: "Quotes",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimateLow",
                table: "Quotes",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeLabor",
                table: "Quotes",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeShipping",
                table: "Quotes",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Quotes",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.Sql(
                "UPDATE `Quotes` SET `EstimateLow` = `Total`, `EstimateHigh` = `Total`;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstimateHigh",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "EstimateLow",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "IncludeLabor",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "IncludeShipping",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Quotes");
        }
    }
}
